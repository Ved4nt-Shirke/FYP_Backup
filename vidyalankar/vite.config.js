import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '')
  
  // Extract base URL without /api suffix for proxy target
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  const proxyTarget = apiBaseUrl.replace('/api', '')
  
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
