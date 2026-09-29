import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// The codebase imports as `components/...` (CRA set jsconfig baseUrl=src).
// Vite ignores jsconfig, so map that bare root to src/components.
const srcComponents = fileURLToPath(new URL('./src/components', import.meta.url));

// base must match the GitHub Pages subpath (homepage = .../listbuilder).
// With base='/listbuilder', `vite` serves the app at /listbuilder/ in dev and
// the build emits assets under /listbuilder/ so the gh-pages deploy keeps working.
export default defineConfig({
  base: '/listbuilder',
  plugins: [react()],
  resolve: {
    alias: {
      components: srcComponents,
    },
  },
  // This codebase keeps JSX in .js files (CRA convention). Two esbuild knobs are
  // needed because Vite applies them to different passes:
  //  - top-level `esbuild` drives the DEV transform + BUILD of source .js files,
  //    so they must parse .js as JSX-capable (otherwise vite:import-analysis hits
  //    raw JSX and 500s, or the build fails).
  //  - `optimizeDeps.esbuildOptions` drives the dependency SCANNER, which runs
  //    esbuild over the source graph separately and needs the same loader or the
  //    first boot fails and skips pre-bundling.
  esbuild: {
    loader: 'jsx',
    include: /\.(js|jsx)$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
  },
  css: {
    preprocessorOptions: {
      // NOTE: Vite keys this object by the file extension it compiles ('scss'
      // for .scss files), NOT by the compiler name ('sass'). Options under a
      // 'sass' key are silently ignored. These are forwarded verbatim to the
      // Dart Sass compileStringAsync() call.
      scss: {
        // Exact deprecation IDs Bootstrap 5.3.x emits under Dart Sass 1.104,
        // verified by compiling bootstrap.scss (20 warnings total).
        silenceDeprecations: [
          'import',
          'if-function',
          'global-builtin',
          'color-functions',
        ],
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    globals: true,
  },
});
