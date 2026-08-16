import { ipcMain, BrowserWindow } from 'electron';
import { updateTrayMenu } from './main.js';

import SettingsService from '../services/settings.service.js';
import CpuService from '../services/cpu.hardware.js';
import DiskService from '../services/disk.hardware.js';
import PowerService from '../services/power.service.js';
import NetworkService from '../services/network.hardware.js';
import SystemInfoService from '../services/system.service.js';
import HardwareService from '../services/hardware.service.js';

import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export function setupIpcRouter() {
    // -------------------------------------------------------------
    // MICROSSERVIÇOS DE HARDWARE & SISTEMA
    // -------------------------------------------------------------
    ipcMain.removeHandler('stats:cpu');
    ipcMain.handle('stats:cpu', () => CpuService.getCpuStats());

    ipcMain.removeHandler('stats:disk');
    ipcMain.handle('stats:disk', () => DiskService.getDiskStats());

    ipcMain.removeHandler('stats:network');
    ipcMain.handle('stats:network', () => NetworkService.getNetworkStats());

    ipcMain.removeHandler('stats:system');
    ipcMain.handle('stats:system', () => SystemInfoService.getSystemStats());

    ipcMain.removeHandler('stats:flush-mem');
    ipcMain.handle('stats:flush-mem', () => CpuService.flushMemory());

    // -------------------------------------------------------------
    // GERENCIADOR DE PROCESSOS (Process Manager)
    // -------------------------------------------------------------
    ipcMain.removeHandler('process:get-list');
    ipcMain.handle('process:get-list', async () => {
        try {
            // Tasklist nativo do Windows com timeout de segurança
            const { stdout } = await execAsync('tasklist /FO CSV /NH', { shell: 'cmd.exe', encoding: 'utf8', timeout: 5000 });
            if (!stdout || !stdout.trim()) return [];

            const lines = stdout.split(/\r?\n/);
            const processes = [];

            for (const line of lines) {
                if (!line.trim()) continue;
                const parts = line.split('","').map(p => p.replace(/"/g, ''));

                if (parts.length >= 5) {
                    const name = parts[0];
                    const pid = parseInt(parts[1], 10);
                    const type = parts[2];

                    // Extrai apenas os números e converte para numérico em KB
                    const rawMem = parts[4].replace(/[^0-9]/g, '');
                    const memoryKB = rawMem ? parseInt(rawMem, 10) : 0;

                    if (!isNaN(pid)) {
                        processes.push({
                            pid,
                            name,
                            memoryKB,
                            type
                        });
                    }
                }
            }
            return processes;
        } catch (error) {
            return [];
        }
    });

    ipcMain.removeHandler('process:kill');
    ipcMain.handle('process:kill', async (event, pid) => {
        try {
            await execAsync(`taskkill /pid ${pid} /f`, { shell: 'cmd.exe', timeout: 5000 });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // -------------------------------------------------------------
    // MONITOR DE HARDWARE (Nativo Windows)
    // -------------------------------------------------------------
    ipcMain.removeHandler('hardware:get-detailed-info');
    ipcMain.handle('hardware:get-detailed-info', async () => {
        return await HardwareService.getDetailedHardwareInfo();
    });

    // -------------------------------------------------------------
    // PLANOS DE ENERGIA & BATERIA (Nativo Windows)
    // -------------------------------------------------------------
    ipcMain.removeHandler('power:get-plans');
    ipcMain.handle('power:get-plans', async () => {
        return await PowerService.getPlans();
    });

    ipcMain.removeHandler('power:set-plan');
    ipcMain.handle('power:set-plan', async (event, planId) => {
        try {
            const result = await PowerService.setPlan(planId);

            // Se alterou com sucesso na máquina, atualiza imediatamente o Tray
            if (result.success) {
                await updateTrayMenu();
            }

            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.removeHandler('power:get-battery');
    ipcMain.handle('power:get-battery', async () => {
        return await PowerService.getBattery();
    });

    // -------------------------------------------------------------
    // CONTROLE DE JANELA
    // -------------------------------------------------------------
    ipcMain.removeAllListeners('window:minimize');
    ipcMain.on('window:minimize', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) return;

        try {
            const settings = SettingsService.getSettings();

            // Se a opção de minimizar para a bandeja estiver ATIVADA
            if (settings.minimizeToTray) {
                win.hide(); // Oculta a janela de vez (some da tela e da barra de tarefas)
            } else {
                win.minimize(); // Comportamento padrão do Windows
            }
        } catch (e) {
            win.minimize(); // Fallback de segurança
        }
    });

    ipcMain.removeAllListeners('window:maximize');
    ipcMain.on('window:maximize', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win?.isMaximized()) win.unmaximize();
        else win?.maximize();
    });

    ipcMain.removeAllListeners('window:close');
    ipcMain.on('window:close', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win) {
            win.close();
        }
    });
}