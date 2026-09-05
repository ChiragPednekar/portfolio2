import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        other: resolve(__dirname, 'other-work/index.html'),
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
