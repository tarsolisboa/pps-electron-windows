import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Apaga o máximo possível de forma assíncrona sem travar a main thread
 * e pula silenciosamente os arquivos que estão em uso.
 */
async function clearDirectory(dirPath) {
    try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);

            try {
                if (item.isDirectory()) {
                    // Limpa recursivamente os arquivos de dentro da subpasta primeiro
                    await clearDirectory(fullPath);

                    // Tenta remover a pasta vazia
                    try {
                        await fs.rmdir(fullPath);
                    } catch (e) {
                        // Se a pasta ainda contiver arquivos em uso, ignora silenciosamente
                    }
                } else {
                    // Garante permissão de escrita antes de deletar (corrige read-only)
                    try {
                        await fs.chmod(fullPath, 0o666);
                    } catch (e) { }

                    // Força a remoção do arquivo
                    await fs.unlink(fullPath);
                }
            } catch (err) {
                // Arquivo em uso por outro processo ativo - pula para o próximo
            }
        }
    } catch (err) {
        // Permissão negada no nível da pasta raiz ou a pasta não existe
    }
}

// Mapeamento dos caminhos (Exclusivo para Windows)
function getPathsForCategory(categoryId) {
    const homeDir = os.homedir();

    switch (categoryId) {
        case 'system_temp':
            return [
                process.env.TEMP || path.join(homeDir, 'AppData', 'Local', 'Temp'),
                'C:\\Windows\\Temp'
            ];
        case 'trash_bin':
            return []; // O Windows usa um comando direto do PowerShell
        case 'user_cache':
            return [path.join(homeDir, 'AppData', 'Local', 'Cache')];
        case 'browser_cache':
            return [
                path.join(homeDir, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Cache'),
                path.join(homeDir, 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache')
            ];
        case 'system_logs':
            return ['C:\\Windows\\Logs'];
        default:
            return [];
    }
}

// Retorna o tamanho total puramente em bytes, de forma assíncrona
async function getDirectorySize(dirPath) {
    let totalSize = 0;

    try {
        const stats = await fs.lstat(dirPath);
        if (stats.isFile()) return stats.size;

        if (stats.isDirectory()) {
            const items = await fs.readdir(dirPath, { withFileTypes: true });
            for (const item of items) {
                const filePath = path.join(dirPath, item.name);
                try {
                    if (item.isDirectory()) {
                        totalSize += await getDirectorySize(filePath);
                    } else {
                        const fileStats = await fs.lstat(filePath);
                        totalSize += fileStats.size;
                    }
                } catch (err) { }
            }
        }
    } catch (err) { }

    return totalSize;
}

// Retorna os dados crus de varredura
async function scanSystem() {
    const categories = [
        'system_temp',
        'trash_bin',
        'user_cache',
        'browser_cache',
        'system_logs'
    ];

    const results = [];

    for (const catId of categories) {
        let totalBytes = 0;
        const paths = getPathsForCategory(catId);

        for (const targetPath of paths) {
            totalBytes += await getDirectorySize(targetPath);
        }

        // Retorna a chave técnica (catId) e o valor bruto (totalBytes)
        results.push({ id: catId, sizeBytes: totalBytes });
    }

    return results;
}

// Executa a limpeza baseada nas chaves
async function cleanCategories(selectedCategoryIds = []) {
    try {
        for (const catId of selectedCategoryIds) {
            if (catId === 'trash_bin') {
                // Timeout de 8 segundos evita travamento caso a lixeira seja muito pesada
                await execAsync('PowerShell -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"', { windowsHide: true, timeout: 8000 });
            } else {
                const targetPaths = getPathsForCategory(catId);
                for (const targetPath of targetPaths) {
                    await clearDirectory(targetPath);
                }
            }
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

const CleanerService = {
    scanSystem,
    cleanCategories
};

export default CleanerService;