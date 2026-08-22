import { app, BrowserWindow, ipcMain, Tray, Menu, dialog, nativeImage } from 'electron';
import path from 'node:path';
import { setupIpcRouter } from './router.js';

// Importações dos serviços
import CleanerService from '../services/cleaner.service.js';
import StartupService from '../services/startup.service.js';
import NetworkService from '../services/network.service.js';
import SettingsService from '../services/settings.service.js';
import UninstallerService from '../services/uninstaller.service.js';
import PowerService from '../services/power.service.js';

ipcMain.handle('system:getPlatform', () => {
    return 'win32';
});

// -------------------------------------------------------------
// MICROSSERVIÇOS (IPC Handlers que não estão no router.js)
// -------------------------------------------------------------
ipcMain.handle('settings:get', () => SettingsService.getSettings());
ipcMain.handle('settings:save', (_, data) => SettingsService.saveSettings(data));

// -------------------------------------------------------------
// CLEANER
// -------------------------------------------------------------
ipcMain.removeHandler('cleaner:scan');
ipcMain.handle('cleaner:scan', async () => {
    return await CleanerService.scanSystem();
});

ipcMain.removeHandler('cleaner:clean');
ipcMain.handle('cleaner:clean', async (event, selectedIds) => {
    return await CleanerService.cleanCategories(selectedIds);
});

// -------------------------------------------------------------
// STARTUP
// -------------------------------------------------------------    
ipcMain.removeHandler('startup:getApps');
ipcMain.handle('startup:getApps', async () => {
    return await StartupService.getApps();
});

ipcMain.removeHandler('startup:toggleApp');
ipcMain.handle('startup:toggleApp', async (event, appId, enable) => {
    return await StartupService.toggleApp(appId, enable);
});

// -------------------------------------------------------------
// UNINSTALLER
// -------------------------------------------------------------
ipcMain.removeHandler('uninstaller:getApps');
ipcMain.handle('uninstaller:getApps', async () => {
    try {
        return await UninstallerService.getApps();
    } catch (e) {
        return [];
    }
});

ipcMain.removeHandler('uninstaller:uninstall');
ipcMain.handle('uninstaller:uninstall', async (event, uninstallString) => {
    try {
        return await UninstallerService.uninstall(uninstallString);
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// -------------------------------------------------------------
// SECURITY
// -------------------------------------------------------------
ipcMain.removeHandler('get-security-status');
ipcMain.handle('get-security-status', async () => {
    try {
        const osInfo = await si.osInfo();
        const antivirus = await si.antivirus();

        return {
            success: true,
            os: {
                platform: osInfo.platform,
                release: osInfo.release,
                build: osInfo.build,
                codename: osInfo.codename,
                uefi: osInfo.uefi
            },
            antivirus: antivirus || []
        };
    } catch (error) {
        console.error("Erro ao buscar dados de segurança:", error);
        return { success: false, os: null, antivirus: [] };
    }
});

// Atalho para abrir as configurações nativas do Windows Update
ipcMain.removeHandler('open-windows-update');
ipcMain.handle('open-windows-update', async () => {
    await shell.openExternal('ms-settings:windowsupdate');
});

// -------------------------------------------------------------
// NETWORK
// -------------------------------------------------------------
ipcMain.removeHandler('network:testDns');
ipcMain.handle('network:testDns', async () => {
    return await NetworkService.runDnsBenchmark();
});

ipcMain.removeHandler('network:flushDns');
ipcMain.handle('network:flushDns', async () => {
    return await NetworkService.flushDnsCache();
});

ipcMain.removeHandler('network:getInterfaces');
ipcMain.handle('network:getInterfaces', async () => {
    try {
        return await NetworkService.getNetworkInterfaces();
    } catch (e) {
        return [];
    }
});

ipcMain.removeHandler('network:getSpeed');
ipcMain.handle('network:getSpeed', async () => {
    try {
        return await NetworkService.getNetworkSpeed();
    } catch (e) {
        // Removido o fallback de string '0 B/s'
        return { downloadBytesPerSec: 0, uploadBytesPerSec: 0 };
    }
});

ipcMain.removeHandler('network:getConnections');
ipcMain.handle('network:getConnections', async () => {
    try {
        return await NetworkService.getActiveConnections();
    } catch (e) {
        return [];
    }
});

// -------------------------------------------------------------
// WEBVIEW E JANELA PRINCIPAL
// -------------------------------------------------------------
let mainWindow = null;
let tray = null;
let isQuitting = false;

let trayIcon = app.isPackaged
    ? nativeImage.createFromPath(path.join(process.resourcesPath, 'favicon.ico'))
    : nativeImage.createFromPath(path.join(__dirname, '../../public/favicon.ico'));

app.on('before-quit', () => {
    isQuitting = true;
});

// =============================================================
// FUNÇÃO DINÂMICA DO MENU DA BANDEJA (TRAY)
// =============================================================
export async function updateTrayMenu() {
    if (!tray) return;

    // Pega o idioma salvo nas configurações para traduzir o menu do Tray
    const settings = await SettingsService.getSettings();
    const lang = settings.language || 'en';

    const trayTexts = {
        'de': { show: 'Programm anzeigen', plans: 'Energiepläne', exit: 'Beenden', noPlans: 'Keine Pläne gefunden' },
        'en': { show: 'Show window', plans: 'Power Plans', exit: 'Exit', noPlans: 'No plans found' },
        'es': { show: 'Mostrar programa', plans: 'Planes de energía', exit: 'Salir', noPlans: 'No se encontraron planes' },
        'fr': { show: 'Vitrine', plans: 'Modes de gestion de l\'alimentation', exit: 'Sortie', noPlans: 'Aucun plan trouvé' },
        'jp': { show: 'ショーウィンドウ', plans: '電源プラン', exit: '出口', noPlans: 'プランは見つかりませんでした' },
        'pt': { show: 'Reexibir o programa', plans: 'Planos de Energia', exit: 'Encerrar', noPlans: 'Nenhum plano encontrado' },
        'ru': { show: 'Показать программу', plans: 'Планы питания', exit: 'Выход', noPlans: 'Планы не найдены' },
        'zh-TW': { show: '顯示程式', plans: '電源計畫', exit: '退出', noPlans: '未找到計畫' }
    };

    const tTexts = trayTexts[lang] || trayTexts['en'];

    const plans = await PowerService.getPlans();

    const plansSubMenu = plans.length > 0 ? plans.map(plan => ({
        label: plan.name,
        type: 'radio',
        checked: plan.active,
        click: async () => {
            await PowerService.setPlan(plan.id);
            await updateTrayMenu();

            // FORÇA O ENVIO DIRETO PARA A JANELA ATIVA DO RENDERER
            if (mainWindow && !mainWindow.webContents.isDestroyed()) {
                mainWindow.webContents.send('power:plan-changed', plan.id);
            }
        }
    })) : [{ label: tTexts.noPlans, enabled: false }];

    const contextMenu = Menu.buildFromTemplate([
        {
            label: tTexts.show,
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        { type: 'separator' },
        {
            label: tTexts.plans,
            submenu: plansSubMenu
        },
        { type: 'separator' },
        {
            label: tTexts.exit,
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);
}

const createWindow = () => {

    mainWindow = new BrowserWindow({
        width: 1000,
        height: 730,
        minWidth: 800,
        minHeight: 550,
        frame: false,
        center: true,
        show: true,
        alwaysOnTop: false,
        autoHideMenuBar: true,
        icon: trayIcon,        
        transparent: true,
        backgroundColor: '#00000000',
        webPreferences: {
            preload: path.join(__dirname, 'bridge.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

    // OMNICHECK SCREEN
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        mainWindow.loadURL(devUrl);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/main_window/index.html'));
    }

    // 1. Bloqueia atalhos de teclado do DevTools (F12, Ctrl+Shift+I, etc.)
    //mainWindow.webContents.openDevTools({ mode: 'detach' });
    mainWindow.webContents.on('before-input-event', (event, input) => {
        // Bloqueia F12
        if (input.key === 'F12') {
            event.preventDefault();
        }

        // Bloqueia Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C e Ctrl+U (código fonte)
        if (input.control && input.shift && ['I', 'J', 'C', 'i', 'j', 'c'].includes(input.key)) {
            event.preventDefault();
        }

        if (input.control && ['U', 'u'].includes(input.key)) {
            event.preventDefault();
        }
    });

    // 2. Desativa o clique com o botão direito (Menu de Contexto / Inspecionar)
    mainWindow.webContents.on('context-menu', (event) => {
        event.preventDefault();
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    // ---------------------------------------------------------
    // 1. REGRA DE MINIMIZAR (Botão "_" da barra customizada)
    // ---------------------------------------------------------
    mainWindow.on('minimize', (event) => {
        const settings = SettingsService.getSettings();

        // Se a opção de minimizar para a bandeja estiver ativada, esconde a janela
        if (settings.minimizeToTray) {
            event.preventDefault();
            mainWindow.hide();
        }
        // Se estiver desativada, o Windows faz o comportamento padrão (minimiza normal)
    });

    // ---------------------------------------------------------
    // 2. REGRA DE FECHAR / SAIR (Botão "X" ou "Encerrar" do Tray)
    // ---------------------------------------------------------
    mainWindow.on('close', async (event) => {
        // Se a ordem veio do Tray (botão Encerrar) ou se já decidimos sair, fecha direto
        if (isQuitting) return;

        event.preventDefault(); // Impede o fechamento imediato para avaliar a regra de confirmação

        try {
            const settings = SettingsService.getSettings();

            // Verifica se a opção "Confirmar ao sair" está ativada
            if (settings.confirmOnExit) {
                const dialogTexts = {
                    'de': { title: 'Bestätigung', msg: 'Möchten Sie OmniCheck wirklich beenden?', btnYes: 'Ja, nah dran.', btnNo: 'Nein, abbrechen' },
                    'en': { title: 'Confirmation', msg: 'Do you really want to exit OmniCheck?', btnYes: 'Yes, close', btnNo: 'No, cancel' },
                    'es': { title: 'Confirmación', msg: '¿Realmente deseas salir de OmniCheck?', btnYes: 'Sí, cerca', btnNo: 'No, cancelar' },
                    'ft': { title: 'Confirmation', msg: 'Voulez-vous vraiment quitter OmniCheck ?', btnYes: 'Oui, tout près', btnNo: 'Non, annuler' },
                    'jp': { title: '確認', msg: '本当に OmniCheck を終了しますか？', btnYes: 'はい、近いです。', btnNo: 'いいえ、キャンセルします' },
                    'pt': { title: 'Confirmação', msg: 'Deseja realmente encerrar o OmniCheck?', btnYes: 'Sim, encerrar', btnNo: 'Não, cancelar' },
                    'ru': { title: 'Подтверждение', msg: 'Вы действительно хотите выйти из OmniCheck?', btnYes: 'Да, близко', btnNo: 'Нет, отмена' },
                    'zh-TW': { title: '確認', msg: '您確定要退出 OmniCheck 嗎？', btnYes: '是的，很接近', btnNo: '不，取消' }
                };

                const lang = settings.language || 'en';
                const texts = dialogTexts[lang] || dialogTexts['en'];

                const choice = await dialog.showMessageBox(mainWindow, {
                    type: 'question',
                    buttons: [texts.btnYes, texts.btnNo],
                    defaultId: 0,
                    cancelId: 1,
                    title: texts.title,
                    message: texts.msg
                });

                // Se clicou em "Sim, encerrar" (índice 0)
                if (choice.response === 0) {
                    isQuitting = true;
                    app.quit();
                }
                // Se clicou em "Cancelar" (índice 1), não faz nada e o app continua aberto
                return;
            } else {
                // Se "Confirmar ao sair" estiver desligado, encerra direto sem aviso
                isQuitting = true;
                app.quit();
            }

        } catch (e) {
            console.error("Erro ao processar o encerramento:", e);
            isQuitting = true;
            app.quit();
        }
    });
};

app.whenReady().then(async () => {
    setupIpcRouter();
    createWindow();

    // CRIAÇÃO DO ÍCONE NA BANDEJA (TRAY)
    try {
        if (trayIcon.isEmpty()) {
            trayIcon = nativeImage.createEmpty();
        }

        tray = new Tray(trayIcon);
        tray.setToolTip('OmniCheck');

        // CHAMA A FUNÇÃO PARA CONSTRUIR O MENU COM OS PLANOS DE ENERGIA
        await updateTrayMenu();

        // Atualiza a lista sempre que o usuário clicar no ícone do tray
        tray.on('click', () => {
            updateTrayMenu();
        });

        tray.on('double-click', () => {
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
            }
        });
    } catch (error) {
        console.error('Falha ao criar o Tray:', error);
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    app.quit();
});