import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

// Salva os dados na pasta do usuário no Windows (%AppData%/nome-do-app)
const configPath = path.join(app.getPath('userData'), 'user-settings.json');

const defaultSettings = {
    language: 'en',
    confirmOnExit: true,
    minimizeToTray: true
};

class SettingsService {
    getSettings() {
        try {
            if (fs.existsSync(configPath)) {
                const data = fs.readFileSync(configPath, 'utf-8');
                return { ...defaultSettings, ...JSON.parse(data) };
            }
        } catch (error) {
            console.error('Erro ao ler configurações:', error);
        }
        return defaultSettings;
    }

    saveSettings(newSettings) {
        try {
            const current = this.getSettings();
            const updated = { ...current, ...newSettings }; // Mescla os dados recebidos
            fs.writeFileSync(configPath, JSON.stringify(updated, null, 2));
            return true;
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            return false;
        }
    }
}

export default new SettingsService();