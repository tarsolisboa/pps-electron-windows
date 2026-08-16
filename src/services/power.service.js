import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

class PowerService {
    async getPlans() {
        try {
            let activeGuid = null;
            try {
                const activeRes = await execAsync('powercfg /getactivescheme', { shell: 'cmd.exe', timeout: 5000 });
                const matchActive = activeRes.stdout.match(/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/);
                if (matchActive) activeGuid = matchActive[0].toLowerCase();
            } catch (e) {}

            const masterPlans = new Map();
            try {
                const { stdout } = await execAsync('chcp 65001 && powercfg /list', { encoding: 'utf-8', timeout: 5000 });
                const lines = stdout.split(/\r?\n/);
                
                lines.forEach((line) => {
                    if (line.toUpperCase().includes('GUID')) {
                        const idMatch = line.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
                        const nameMatch = line.match(/\(([^)]+)\)/);
                        if (idMatch) {
                            masterPlans.set(idMatch[0].toLowerCase(), nameMatch ? nameMatch[1].trim() : 'Plano de Energia');
                        }
                    }
                });
            } catch (err) {}

            if (activeGuid && !masterPlans.has(activeGuid)) {
                masterPlans.set(activeGuid, 'Plano Ativo');
            }

            return Array.from(masterPlans.entries()).map(([id, name]) => ({
                id,
                name,
                active: id === activeGuid
            }));
        } catch (error) {
            return [];
        }
    }

    async setPlan(planId) {
        try {
            await execAsync(`powercfg /setactive ${planId}`, { timeout: 5000 });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getBattery() {
        try {
            const { stdout } = await execAsync('powershell "(Get-WmiObject Win32_Battery).EstimatedChargeRemaining"', { timeout: 5000 });
            const level = parseInt(stdout.trim(), 10);
            
            return { 
                level: isNaN(level) ? null : level, 
                statusCode: isNaN(level) ? 'desktop' : 'battery' 
            };
        } catch {
            return { level: null, statusCode: 'desktop' };
        }
    }
}

export default new PowerService();