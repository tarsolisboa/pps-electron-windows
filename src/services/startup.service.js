import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const HOME_DIR = os.homedir();
let cacheApps = [];

// Helper para executar comandos do CMD de forma assíncrona com timeout
async function execCmd(cmd) {
  try {
    const { stdout } = await execAsync(cmd, { encoding: 'utf-8', windowsHide: true, timeout: 5000 });
    return stdout || '';
  } catch (e) {
    return '';
  }
}

// 1. Extrai chaves de registro do Windows
async function getRegKey(keyPath) {
  const output = await execCmd(`reg query "${keyPath}"`);
  const result = {};
  
  if (output) {
    const lines = output.split(/\r?\n/);
    for (const line of lines) {
      // Isola o Nome do App, o Tipo de Registro e o Valor
      const match = line.match(/^\s*(.+?)\s+(REG_SZ|REG_EXPAND_SZ|REG_BINARY)\s+(.+)$/i);
      if (match) {
        result[match[1].trim()] = { type: match[2], value: match[3].trim() };
      }
    }
  }
  return result;
}

const StartupService = {
  // Varredura de aplicativos de inicialização nativa do Windows
  async getApps() {
    const apps = [];

    // O Windows guarda as aprovações/desativações no HKCU
    const approvedRun = await getRegKey('HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run');
    const approvedRun32 = await getRegKey('HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run32');
    const approvedFolder = await getRegKey('HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\StartupFolder');

    // Mapeamento das chaves de registro principais
    const registryLocations = [
      { path: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', apprv: approvedRun, cat: 'Run' },
      { path: 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', apprv: approvedRun, cat: 'Run' },
      { path: 'HKCU\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run', apprv: approvedRun32, cat: 'Run32' },
      { path: 'HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run', apprv: approvedRun32, cat: 'Run32' }
    ];

    // 1A. Varredura no Registro (32 e 64 bits)
    for (const loc of registryLocations) {
      const keys = await getRegKey(loc.path);
      for (const [name, data] of Object.entries(keys)) {
        let isEnabled = true;
        
        // Verifica status de aprovação. O Windows usa '02' para ativo.
        if (loc.apprv[name]) {
          isEnabled = loc.apprv[name].value.startsWith('02');
        }

        // Evita duplicatas
        if (!apps.some(a => a.name.toLowerCase() === name.toLowerCase())) {
          apps.push({
            id: `win_reg_${Buffer.from(name).toString('hex')}`,
            name: name,
            path: data.value,
            approvalCategory: loc.cat,
            approvalName: name,
            enabled: isEnabled,
            // Chaves técnicas para o frontend (i18n) tratar
            impact: name.toLowerCase().includes('onedrive') || name.toLowerCase().includes('steam') ? 'high' : 'medium'
          });
        }
      }
    }

    // 1B. Varredura nas Pastas Startup
    const folders = [
      path.join(HOME_DIR, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup'),
      'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup'
    ];

    for (const folder of folders) {
      try {
        const files = await fs.readdir(folder); // Operação assíncrona que não trava a UI
        for (const file of files) {
          if (!file.startsWith('.') && file.match(/\.(lnk|url|exe|bat)$/i)) {
            let isEnabled = true;
            if (approvedFolder[file]) {
              isEnabled = approvedFolder[file].value.startsWith('02');
            }

            apps.push({
              id: `win_folder_${Buffer.from(file).toString('hex')}`,
              name: file.replace(/\.(lnk|url|exe|bat)$/i, ''),
              path: path.join(folder, file),
              approvalCategory: 'StartupFolder',
              approvalName: file,
              enabled: isEnabled,
              impact: 'low' // Chave técnica para i18n
            });
          }
        }
      } catch (e) {
        // Falha silenciosa caso a pasta não exista
      }
    }

    cacheApps = apps;
    return apps;
  },

  // Alterna o status do aplicativo no registro do Windows
  async toggleApp(appId, enable) {
    try {
      const targetApp = cacheApps.find(a => a.id === appId);
      if (!targetApp) return { success: false, error: 'not_found' };

      // O Windows utiliza 02... para habilitar e 03... para desabilitar
      const binValue = enable ? '020000000000000000000000' : '030000000000000000000000';
      const keyPath = `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\${targetApp.approvalCategory}`;
      
      const escapedName = targetApp.approvalName.replace(/"/g, '""');
      
      // Força a escrita no registro de Aprovação do Usuário
      await execCmd(`reg add "${keyPath}" /v "${escapedName}" /t REG_BINARY /d ${binValue} /f`);
      
      targetApp.enabled = enable;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

export default StartupService;