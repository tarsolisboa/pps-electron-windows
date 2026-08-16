import si from 'systeminformation';

const DiskService = {
    async getDiskStats() {
        try {
            const fsSize = await si.fsSize();
            // Em caso de array vazio, o fallback utiliza 0 absoluto e mount nulo
            const mainDisk = fsSize[0] || { size: 0, used: 0, use: 0, mount: null };

            return {
                diskMount: mainDisk.mount || null,
                // Retorna os dados crus em Bytes no lugar de strings em GB
                diskUsedBytes: mainDisk.used || 0,
                diskTotalBytes: mainDisk.size || 0,
                diskPercentage: Math.round(mainDisk.use || 0),
            };
        } catch (error) {
            // Retorno estruturado seguro e sem strings fixas caso a leitura falhe
            return { 
                diskMount: null, 
                diskUsedBytes: 0, 
                diskTotalBytes: 0, 
                diskPercentage: 0 
            };
        }
    }
};

export default DiskService;