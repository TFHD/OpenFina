import { getRequestListener } from '@hono/node-server'
import type { Plugin } from 'vite'
import { isApiPath } from './lib/api-paths.ts'

export function apiPlugin(): Plugin {
    let listener: ReturnType<typeof getRequestListener> | null = null

    return {
        name: 'openFina-api',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const url = req.url?.split('?')[0] ?? ''

                if (!isApiPath(url)) {
                    next()
                    return
                }

                try {
                    if (!listener) {
                        const { createApp } = await import('./app.ts')
                        const app = await createApp()
                        listener = getRequestListener(app.fetch)
                    }

                    await listener(req, res)
                } catch (error) {
                    console.error('API middleware error:', error)
                    res.statusCode = 500
                    res.end()
                }
            })
        },
    }
}
