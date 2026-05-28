import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { glob } from 'glob';
import path from 'path';

// Search for all .jsx files in blocks/ and create an entry for each
function getReactBlockEntries() {
  const files = glob.sync('blocks/**/*.jsx');
  return Object.fromEntries(
    files.map((file) => {
      const name = path.basename(file, '.jsx');
      return [name, path.resolve(file)];
    }),
  );
}

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5174,
  },
  build: {
    lib: {
      entry: getReactBlockEntries(),
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-dom/client'],
      output: {
        // Chunks shared between blocks go to .build/
        chunkFileNames: '.build/[name]-[hash].js',
        // Assets (CSS, etc.) also go to .build/
        assetFileNames: '.build/[name]-[hash][extname]',
        // Each block is compiled into its own bundle alongside the source
        entryFileNames: (chunkInfo) => {
          const entry = Object.entries(getReactBlockEntries()).find(
            ([name]) => name === chunkInfo.name,
          );
          if (entry) {
            const [, filePath] = entry;
            const dir = path.dirname(filePath);
            const rel = path.relative(process.cwd(), dir);
            return `${rel}/[name].bundle.js`;
          }
          return '[name].bundle.js';
        },
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-dom/client': 'ReactDOMClient',
        },
      },
    },
    outDir: '.build',
    emptyOutDir: false,
  },
}));
