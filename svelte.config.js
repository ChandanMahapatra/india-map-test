import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const NODE_ENV = process.env.NODE_ENV;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess()],
	kit: {
		adapter: adapter({
			fallback: '404.html'
		}),
		paths: {
			base: NODE_ENV === 'development' ? '' : '/india-map-test'
		}
	}
};

export default config;
