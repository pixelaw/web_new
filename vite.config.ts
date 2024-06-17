import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import graphqlLoader from "vite-plugin-graphql-loader";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import {fileURLToPath, URL} from 'url';

export default defineConfig({
    plugins: [
        react(),
        graphqlLoader(),
        wasm(),
        topLevelAwait()
    ],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
