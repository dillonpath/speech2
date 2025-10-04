import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.CLOUDFLARE_WORKER_URL': JSON.stringify(env.CLOUDFLARE_WORKER_URL),
    },
    server: {
      port: 3000
    }
  }
})
