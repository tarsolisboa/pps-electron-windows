import { VitePlugin } from '@electron-forge/plugin-vite';

export default {
    packagerConfig: {},
    rebuildConfig: {},
    makers: [
        { name: '@electron-forge/maker-squirrel', config: {} },
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
};