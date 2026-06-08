import { Hono } from 'hono'
import type { RowDataPacket } from 'mysql2'
import { config } from '../config.ts'
import { getPool } from '../db.ts'
import { logger } from '../logger.ts'

interface AuthTokenRow extends RowDataPacket {
    auth_token: string
}

interface AuthCodeResponse {
    code: string
}

async function getTemporaryToken(): Promise<
    { ok: true; code: string } | { ok: false; status: number; message: string }
> {
    const pool = getPool()

    const [rows] = await pool.query<AuthTokenRow[]>(
        'SELECT auth_token FROM authToken LIMIT 1',
    )

    if (rows.length === 0) {
        return {
            ok: false,
            status: 404,
            message: 'Permanent user token does not exist',
        }
    }

    const permanentUserToken = rows[0].auth_token
    logger.trace('Fetched permanent user token')

    const url = `https://${config.powens.domain}-sandbox.biapi.pro/2.0/auth/token/code`
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${permanentUserToken}` },
    })

    if (!response.ok) {
        return {
            ok: false,
            status: 500,
            message: `Powens did not answer correctly: ${response.statusText}`,
        }
    }

    const code = (await response.json()) as AuthCodeResponse
    logger.trace('Fetched temporary code')
    return { ok: true, code: code.code }
}

export const webviewRoutes = new Hono()

webviewRoutes.get('/webview/manageConnectionLink/', async (c) => {
    try {
        const token = await getTemporaryToken()

        if (token.ok === false) {
            const { message, status } = token
            logger.error(message)
            return c.text(message, status as 404 | 500)
        }

        const params = new URLSearchParams({
            domain: `${config.powens.domain}-sandbox`,
            client_id: config.powens.clientId,
            redirect_uri: config.powens.redirectUrl,
            connector_capabilities: 'bank,bankwealth',
            code: token.code,
        })

        const connectionUrl = `${config.powens.webviewUrl}${config.other.language}/manage?${params}`
        return c.text(connectionUrl)
    } catch (error) {
        logger.error('Failed to build manage connection link', { error: String(error) })
        return c.text(String(error), 500)
    }
})
