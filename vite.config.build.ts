import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Group by packages for better caching
          if (id.includes('node_modules')) {
            // Core React dependencies
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Monaco Editor - large dependency, separate chunk
            if (id.includes('monaco-editor') || id.includes('@monaco-editor')) {
              return 'monaco';
            }
            // UI library - Radix UI components
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Utility libraries
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utils-vendor';
            }
            // Query and form libraries
            if (id.includes('@tanstack/react-query') || id.includes('react-hook-form') || id.includes('@hookform/resolvers')) {
              return 'forms-vendor';
            }
            // Icons - separate for better caching
            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'icons-vendor';
            }
            // Charts and visualization
            if (id.includes('recharts')) {
              return 'charts-vendor';
            }
            // Other vendor dependencies
            return 'vendor';
          }
        },
        // Optimize asset filenames for better caching
        assetFileNames: (assetInfo) => {
          const fileName = assetInfo.name || '';
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(fileName)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.(css)$/i.test(fileName)) {
            return `assets/styles/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    chunkSizeWarningLimit: 800, // Reasonable limit for modern apps
    minify: 'terser', // Better compression than esbuild
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'] // Remove specific console methods
      }
    },
    sourcemap: false, // Disable sourcemaps for smaller builds
    reportCompressedSize: false // Faster builds
  },
  // Add asset optimization
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg']
});