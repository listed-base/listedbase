/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/packages/uni-reactive/core',

  plugins: [nxViteTsPaths()],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [
  //    nxViteTsPaths(),
  //  ],
  // },

  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/packages/uni-reactive/core',
      provider: 'v8',
    },
  },
});
