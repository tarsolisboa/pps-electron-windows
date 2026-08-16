import si from 'systeminformation';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// ==========================================
// CACHES PARA SALVAR O PROCESSADOR
// ==========================================
let cachedOsInfo = null;
let cachedPowerPlan = null;
let lastPowerPlanCheck = 0;

const SystemInfoService = {
    async getSystemStats() {
        try {
            // 1. CACHE ESTÁTICO: Carrega os dados do Windows apenas 1 única vez
            if (!cachedOsInfo) {
                const osInfo = await si.osInfo();
                cachedOsInfo = {
                    deviceName: osInfo.hostname || null,
                    osName: osInfo.distro || osInfo.platform || null,
                    osBuild: osInfo.build || osInfo.release || null,
                };
            }

            // 2. CACHE COM TTL: Checa o plano de energia a cada 60 segundos apenas.
            // Spawmar 'cmd.exe' a cada 3 segundos é o que mais consome CPU em apps Electron/Node.
            const now = Date.now();
            if (!cachedPowerPlan || now - lastPowerPlanCheck > 60000) {
                lastPowerPlanCheck = now;
                try {
                    const { stdout } = await execAsync('chcp 65001 && powercfg /getactivescheme', {
                        encoding: 'utf-8',
                        windowsHide: true,
                        timeout: 2000
                    });
                    const match = stdout.match(/\((.+?)\)/);
                    if (match && match[1]) cachedPowerPlan = match[1].trim();
                } catch (e) {
                    // Silencioso em caso de falha (mantém o valor do cache antigo)
                }
            }

            // 3. CONSULTAS DINÂMICAS: Roda apenas o que realmente muda a cada 3 segundos
            const [time, processes] = await Promise.all([
                si.time(),
                si.processes(),
            ]);

            const topProcesses = (processes.list || [])
                .sort((a, b) => b.cpu - a.cpu || b.mem - a.mem)
                .slice(0, 3)
                .map((p) => ({
                    name: p.name,
                    cpuPercent: Math.round(p.cpu),
                    memRssKB: p.memRss || 0,
                }));

            return {
                deviceName: cachedOsInfo.deviceName,
                osName: cachedOsInfo.osName,
                osBuild: cachedOsInfo.osBuild,
                uptimeSeconds: time.uptime || 0,
                activePowerPlan: cachedPowerPlan,
                topProcesses,
            };
        } catch (error) {
            return {
                deviceName: null,
                osName: null,
                osBuild: null,
                uptimeSeconds: 0,
                activePowerPlan: null,
                topProcesses: []
            };
        }
    }
};

export default SystemInfoService;