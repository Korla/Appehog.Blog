import { defineConfig } from 'astro/config';
import { mdsvexConfig } from './mdsvex.config.js';

// https://astro.build/config
export default defineConfig({
    mdsvex: mdsvexConfig
});
