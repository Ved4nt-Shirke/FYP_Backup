import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '')
  
  // Extract base URL without /api suffix for proxy target
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:5000'
  // Safely strip a trailing /api — avoids clobbering domains that contain "api"
  const proxyTarget = apiBaseUrl.endsWith('/api')
    ? apiBaseUrl.slice(0, -4)
    : apiBaseUrl
  
  return {
    plugins: [react()],
    server: {
      headers: {
        'Content-Security-Policy': "default-src 'self' http://localhost:5000 https://vpciaan.in https://www.vpciaan.in; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com; img-src 'self' data: blob: http://localhost:5000 https://vpciaan.in https://www.vpciaan.in; connect-src 'self' ws://localhost:5173 http://localhost:5000 https://vpciaan.in https://www.vpciaan.in https://cdn.jsdelivr.net;",
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
