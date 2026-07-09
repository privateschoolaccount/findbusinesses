import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

function loadApiPort(): number {
  const envPath = path.resolve(__dirname, '../api-python/.env')
  try {
    const env = fs.readFileSync(envPath, 'utf-8')
    const match = env.match(/^PORT=(\d+)/m)
    return match ? parseInt(match[1], 10) : 8000
  } catch {
    return 8000
  }
}

const apiPort = loadApiPort()

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${apiPort}`,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            const msg = `Proxy error: Backend not reachable at http://127.0.0.1:${apiPort}`
            console.error(msg)
            if (res && 'writeHead' in res) {
              res.writeHead(502, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: msg }))
            }
          })
        },
      },
      '/health': {
        target: `http://127.0.0.1:${apiPort}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
