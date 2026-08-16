import si from 'systeminformation';

// Cache para o nome do adaptador principal (ex: "Wi-Fi" ou "Ethernet")
// Evita varrer dezenas de adaptadores virtuais inúteis a cada 1.5s
let defaultIfaceCache = null;
let lastCacheUpdate = 0;

const NetworkService = {
    async getNetworkStats() {
        try {
            const now = Date.now();

            // Atualiza qual é a rede ativa a cada 30 segundos (caso troque de Wi-Fi para Cabo)
            if (!defaultIfaceCache || now - lastCacheUpdate > 30000) {
                defaultIfaceCache = await si.networkInterfaceDefault();
                lastCacheUpdate = now;
            }

            // Lê o tráfego APENAS do adaptador que tem internet
            const netStats = await si.networkStats(defaultIfaceCache);

            // O retorno pode ser um array (se passar '*') ou objeto (se passar a interface específica)
            const activeNet = Array.isArray(netStats) ? netStats[0] : netStats;

            return {
                downloadBytesPerSec: activeNet?.rx_sec || 0,
                uploadBytesPerSec: activeNet?.tx_sec || 0,
            };
        } catch (error) {
            return { downloadBytesPerSec: 0, uploadBytesPerSec: 0 };
        }
    }
};

export default NetworkService;