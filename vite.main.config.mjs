import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/app/main.js',
            fileName: 'main',
            formats: ['cjs'],
        },
        rollupOptions: {
            external: ['electron', 'systeminformation', 'child_process', 'path', 'fs', 'os'],
        },
    },
});