const si = eval('require')('systeminformation');

// Variáveis de Cache: guardam os dados estáticos para não fritar o processador a cada 1 segundo
let cachedCpuInfo = null;
let cachedMemTotal = null;

const CpuService = {
    async getCpuStats() {
        try {
            // Se o cache estiver vazio (primeira vez que abre o app), ele faz a leitura pesada
            if (!cachedCpuInfo) {
                const [cpuInfo, memInfo] = await Promise.all([si.cpu(), si.mem()]);
                cachedCpuInfo = {
                    manufacturer: cpuInfo.manufacturer || null,
                    name: cpuInfo.brand || null,
                    cores: cpuInfo.physicalCores || cpuInfo.cores || 0,
                    speed: cpuInfo.speed ? cpuInfo.speed : null
                };
                cachedMemTotal = memInfo.total || 0;
            }

            // Consultas ultraleves em tempo real (não acordam o WMI do Windows)
            const [cpuLoad, mem] = await Promise.all([
                si.currentLoad(),
                si.mem()
            ]);

            return {
                cpuLoad: Math.round(cpuLoad.currentLoad || 0),
                cpuManufacturer: cachedCpuInfo.manufacturer,
                cpuName: cachedCpuInfo.name,
                cpuCores: cachedCpuInfo.cores,
                cpuSpeed: cachedCpuInfo.speed,
                memUsedBytes: mem.active || mem.used || 0,
                memTotalBytes: cachedMemTotal,
                memPercentage: cachedMemTotal ? Math.round(((mem.active || mem.used) / cachedMemTotal) * 100) : 0,
            };
        } catch (error) {
            // Em caso de falha, retorna estrutura nula e segura
            return {
                cpuLoad: 0,
                cpuManufacturer: null,
                cpuName: null,
                cpuCores: 0,
                cpuSpeed: null,
                memUsedBytes: 0,
                memTotalBytes: 0,
                memPercentage: 0
            };
        }
    },

    async flushMemory() {
        try {
            if (global.gc) global.gc();
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
};

export default CpuService;