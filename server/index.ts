import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { createApp } from './app.ts'
import { closeDb } from './db.ts'
import { config } from './config.ts'
import { isApiPath } from './lib/api-paths.ts'
import { logger } from './logger.ts'

const distDir = join(process.cwd(), 'dist')

async function main() {
    const app = await createApp()

    app.use('*', async (c, next) => {
        const pathname = new URL(c.req.url).pathname
        if (isApiPath(pathname)) {
            await next()
            return
        }

        return serveStatic({ root: distDir })(c, next)
    })

    app.get('*', async (c) => {
        const pathname = new URL(c.req.url).pathname
        if (isApiPath(pathname)) return c.text('Page does not exist', 404)

        try {
            const html = await readFile(join(distDir, 'index.html'), 'utf8')
            return c.html(html)
        } catch {
            return c.text('Frontend build not found. Run npm run build first.', 404)
        }
    })

    const server = serve(
        {
            fetch: app.fetch,
            port: config.server.port,
        },
        (info) => {
            logger.info(`Server listening on http://localhost:${info.port}`)
        },
    )

    const shutdown = async () => {
        logger.info('Shutting down server...')
        server.close()
        await closeDb()
        process.exit(0)
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
}

main().catch((error) => {
    logger.error('Failed to start server', { error: String(error) })
    process.exit(1)
})
