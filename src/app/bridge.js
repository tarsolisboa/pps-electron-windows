import { contextBridge, ipcRenderer } from 'electron';

// 1. Exposição Estruturada dos Microsserviços
contextBridge.exposeInMainWorld('api', {
    window: {
        minimize: () => ipcRenderer.send('window:minimize'),
        maximize: () => ipcRenderer.send('window:maximize'),
        close: () => ipcRenderer.send('window:close'),
    },
    theme: {
        toggleTheme: (mode) => ipcRenderer.send('theme:toggle', mode),
    },
    hardware: {
        getInfo: () => ipcRenderer.invoke('hardware:get-info'),
        getDetailedInfo: () => ipcRenderer.invoke('hardware:get-detailed-info')
    },
    system: {
        getPlatform: () => ipcRenderer.invoke('system:getPlatform'),
    },
    stats: {
        getCpu: () => ipcRenderer.invoke('stats:cpu'),
        getDisk: () => ipcRenderer.invoke('stats:disk'),
        getNetwork: () => ipcRenderer.invoke('stats:network'),
        getSystem: () => ipcRenderer.invoke('stats:system'),
        flushMem: () => ipcRenderer.invoke('stats:flush-mem'),
    },
    cleaner: {
        scan: () => ipcRenderer.invoke('cleaner:scan'),
        clean: (selectedIds) => ipcRenderer.invoke('cleaner:clean', selectedIds),
    },
    startup: {
        getApps: () => ipcRenderer.invoke('startup:getApps'),
        toggleApp: (appId, enable) => ipcRenderer.invoke('startup:toggleApp', appId, enable),
    },
    process: {
        getList: () => ipcRenderer.invoke('process:get-list'),
        killProcess: (pid) => ipcRenderer.invoke('process:kill', pid)
    },
    security: {
        getSecurityStatus: () => ipcRenderer.invoke('get-security-status'),
        openWindowsUpdate: () => ipcRenderer.invoke('open-windows-update'),
    },
    power: {
        getPlans: () => ipcRenderer.invoke('power:get-plans'),
        setPlan: (planId) => ipcRenderer.invoke('power:set-plan', planId),
        getBattery: () => ipcRenderer.invoke('power:get-battery'),
        onPlanChanged: (callback) => {
            // Remove ouvintes duplicados e escuta o canal
            ipcRenderer.removeAllListeners('power:plan-changed');
            ipcRenderer.on('power:plan-changed', (event, planId) => callback(planId));
        }
    },
    network: {
        getSpeed: () => ipcRenderer.invoke('network:getSpeed'),
        getInterfaces: () => ipcRenderer.invoke('network:getInterfaces'),
        getConnections: () => ipcRenderer.invoke('network:getConnections'),
        testDns: () => ipcRenderer.invoke('network:testDns'),
        flushDns: () => ipcRenderer.invoke('network:flushDns')
    },
    settings: {
        get: () => ipcRenderer.invoke('settings:get'),
        save: (data) => ipcRenderer.invoke('settings:save', data)
    },
    uninstaller: {
        getApps: () => ipcRenderer.invoke('uninstaller:getApps'),
        uninstall: (uninstallString) => ipcRenderer.invoke('uninstaller:uninstall', uninstallString)
    }
});

// 2. Proteção de Variáveis Globais (Focado em Windows)
contextBridge.exposeInMainWorld('process', {
    // Força o retorno do ambiente como Windows para evitar verificações multiplataforma no Frontend
    platform: 'win32',
    versions: process.versions,
    env: { ...process.env }
});