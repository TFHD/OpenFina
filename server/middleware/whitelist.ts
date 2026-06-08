import type { MiddlewareHandler } from 'hono'
import { getConnInfo } from '@hono/node-server/conninfo'
import { config } from '../config.ts'
import { logger } from '../logger.ts'

function normalizeIp(address: string): string {
    if (address.startsWith('::ffff:')) return address.slice(7)
    if (address.startsWith('[') && address.endsWith(']')) return address.slice(1, -1)
    return address
}

export const whitelistMiddleware: MiddlewareHandler = async (c, next) => {
    const connInfo = getConnInfo(c)
    const remoteIp = normalizeIp(connInfo.remote.address ?? '')

    if (!config.powens.whitelistedIps.includes(remoteIp)) {
        logger.warn('Unauthorized IP', { remote_ip: remoteIp })
        return c.body(null, 401)
    }

    await next()
}
