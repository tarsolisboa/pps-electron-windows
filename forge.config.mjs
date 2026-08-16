import { VitePlugin } from '@electron-forge/plugin-vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    packagerConfig: {
        asar: {
            unpack: "**/node_modules/systeminformation/**/*"
        },
        extraResource: [
            "./public/favicon.ico" // Coloque o caminho correto do seu ícone original aqui
        ]
    },
    rebuildConfig: {},
    makers: [
        { 
            name: '@electron-forge/maker-squirrel', 
            config: {
                loadingGif: undefined,
                noMsi: true
            },
            iconUrl: 'http://localhost:5173/favicon.ico',
            setupIcon: './public/favicon.ico'
        },
        { name: '@electron-forge/maker-zip', platforms: ['darwin'] },
        { name: '@electron-forge/maker-deb', config: {} },
        { name: '@electron-forge/maker-dmg', config: {} },
    ],
    plugins: [
        new VitePlugin({
            build: [
                {
                    entry: 'src/app/main.js',
                    config: 'vite.main.config.mjs',
                },
                {
                    entry: 'src/app/bridge.js',
                    config: 'vite.preload.config.mjs',
                },
            ],
            renderer: [
                {
                    name: 'main_window',
                    config: 'vite.renderer.config.mjs',
                },
            ],
        }),
    ],
    hooks: {
        packageAfterPrune: async (config, buildPath) => {
            const srcModule = path.join(__dirname, 'node_modules', 'systeminformation');
            const destModule = path.join(buildPath, 'node_modules', 'systeminformation');

            if (fs.existsSync(srcModule)) {
                fs.mkdirSync(path.dirname(destModule), { recursive: true });
                fs.cpSync(srcModule, destModule, { recursive: true });
                console.log('>>> systeminformation copiado com sucesso para o pacote de produção!');
            }
        }
    }
};