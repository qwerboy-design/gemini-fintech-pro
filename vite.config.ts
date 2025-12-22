import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore - @tailwindcss/vite may not have type definitions
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/gemini-fintech-pro/', // GitHub Pages 的倉庫名稱路徑
  server: {
    proxy: {
      '/api/finmind': {
        target: 'https://api.finmindtrade.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/finmind/, ''),
        secure: true,
      },
    },
  },
})
