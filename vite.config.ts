import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { apiPlugin } from './server/vite-plugin.ts'
import { isApiPath } from './server/lib/api-paths.ts'

function spaFallback(): Plugin {
  return {
    name: 'spa-fallback',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        const accept = req.headers.accept ?? ''

        const isAsset =
          url.includes('.') || url.startsWith('/@') || url.startsWith('/__')

        if (
          req.method === 'GET' &&
          accept.includes('text/html') &&
          !isApiPath(url) &&
          !isAsset
        ) {
          req.url = '/index.html'
        }

        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        const accept = req.headers.accept ?? ''

        const isAsset =
          url.includes('.') || url.startsWith('/@') || url.startsWith('/__')

        if (
          req.method === 'GET' &&
          accept.includes('text/html') &&
          !isApiPath(url) &&
          !isAsset
        ) {
          req.url = '/index.html'
        }

        next()
      })
    },
  }
}

export default defineConfig({
  appType: 'spa',
  plugins: [react(), tailwindcss(), apiPlugin(), spaFallback()],
  server: {
    port: 5173,
  },
})
