import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    root: path.resolve(__dirname, 'src/ui'),
    build: {
        outDir: path.resolve(__dirname, '.vite/renderer/main_window'),
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src/ui'),
        },
    },
});