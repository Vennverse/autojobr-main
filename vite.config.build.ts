import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          utils: ['date-fns', 'clsx', 'tailwind-merge'],
          forms: ['react-hook-form', '@hookform/resolvers'],
          query: ['@tanstack/react-query'],
          icons: ['lucide-react'],
          monaco: ['@monaco-editor/react', 'monaco-editor']
        }
      }
    },
    chunkSizeWarningLimit: 600 // Increase limit to 600kb
  }
});