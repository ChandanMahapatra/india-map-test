import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	publicDir: 'static',
	base: process.env.BASE_PATH ? `/${process.env.BASE_PATH.replace(/^\/+|\/+$/g, '')}/` : '/',
	build: { outDir: 'build' }
});
