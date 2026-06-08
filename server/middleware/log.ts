import type { MiddlewareHandler } from 'hono'
import { getConnInfo } from '@hono/node-server/conninfo'
import { logger } from '../logger.ts'

export const logMiddleware: MiddlewareHandler = async (c, next) => {
    const start = Date.now()
    await next()
    const connInfo = getConnInfo(c)
    const pathname = new URL(c.req.url).pathname
    logger.info('', {
        method: c.req.method,
        url: pathname,
        remote_ip: connInfo.remote.address ?? '',
        msLatency: Date.now() - start,
    })
}
