import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.VITE_CLOUDFLARE_WORKER_URL': JSON.stringify(env.VITE_CLOUDFLARE_WORKER_URL || 'http://localhost:8787'),
    },
    server: {
      port: 3000
    }
  }
})
