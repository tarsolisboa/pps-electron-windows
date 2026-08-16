import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Converte formatos variados do registro do Windows para YYYY-MM-DD
function _parseInstallDateToISO(rawDate) {
    if (!rawDate) return null;
    const str = String(rawDate).trim();

    // Formato Padrão do Registro: YYYYMMDD (ex: 20240512)
    if (/^\d{8}$/.test(str)) {
        const y = str.substring(0, 4);
        const m = str.substring(4, 6);
        const d = str.substring(6, 8);
        return `${y}-${m}-${d}`;
    }

    // Se já contiver hífens ou barras
    if (str.includes('-') || str.includes('/')) {
        const parts = str.split(/[-/]/);
        if (parts.length === 3) {
            if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }

    return null;
}

const UninstallerService = {
    // Busca a lista de aplicativos instalados via PowerShell
    async getApps() {
        const psScript = `
        $ErrorActionPreference = 'SilentlyContinue'
        $keys = @(
          'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
          'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
          'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'
        )
        $apps = Get-ItemProperty $keys | Where-Object { $_.DisplayName -and $_.UninstallString } | Select-Object DisplayName, Publisher, DisplayVersion, UninstallString, InstallDate
        @($apps) | ConvertTo-Json -Compress
      `;

        try {
            const base64Script = Buffer.from(psScript, 'utf16le').toString('base64');
            
            // Executa o PowerShell com maxBuffer alto e timeout de segurança de 15s
            const { stdout } = await execAsync(`PowerShell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${base64Script}`, { 
                windowsHide: true, 
                maxBuffer: 1024 * 1024 * 10, 
                timeout: 15000 
            });

            if (stdout && stdout.trim()) {
                const parsed = JSON.parse(stdout.trim());
                const list = Array.isArray(parsed) ? parsed : [parsed];

                const results = [];
                list.forEach((item, idx) => {
                    if (item && item.DisplayName && !results.some(r => r.name.toLowerCase() === item.DisplayName.toLowerCase())) {
                        const isoDate = _parseInstallDateToISO(item.InstallDate);

                        results.push({
                            id: `win_${idx}_${Buffer.from(item.DisplayName).toString('hex')}`,
                            name: item.DisplayName.trim(),
                            // Chaves nulas para o i18n assumir o controle no frontend
                            publisher: item.Publisher ? item.Publisher.trim() : null,
                            version: item.DisplayVersion ? item.DisplayVersion.trim() : null,
                            uninstallString: item.UninstallString,
                            installDate: isoDate
                        });
                    }
                });

                return results;
            }
        } catch (e) {
            // Falha silenciosa
        }

        return [];
    },

    // Executa a string de desinstalação
    async uninstall(uninstallString) {
        if (!uninstallString) return { success: false, error: 'invalid_string' };
        
        try {
            // Não usamos o promissify nativo aqui para não bloquear a thread aguardando o desinstalador terminar
            exec(uninstallString, { windowsHide: false });
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
};

export default UninstallerService;