import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        aurora: resolve(__dirname, 'work/aurora/index.html'),
        pangeam: resolve(__dirname, 'work/pangeam/index.html'),
        lumus: resolve(__dirname, 'work/lumus/index.html'),
      },
      output: {
        // Keep post-hero modules in their own chunks so the entry stays small.
        manualChunks(id) {
          if (id.includes('node_modules/gsap')) return 'gsap';
          if (id.includes('node_modules/lenis')) return 'lenis';
          if (id.includes('/src/story/')) return 'story';
          if (id.includes('/src/work/')) return 'work';
        },
      },
    },
  },
});
