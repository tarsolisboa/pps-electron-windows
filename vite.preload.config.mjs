import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/app/bridge.js',
            fileName: 'bridge',
            formats: ['cjs'],
        },
        rollupOptions: {
            external: ['electron', 'systeminformation', 'child_process', 'path', 'fs', 'os'],
        },
    },
});