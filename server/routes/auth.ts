import { Hono } from 'hono'
import type { RowDataPacket } from 'mysql2'
import { config } from '../config.ts'
import { getPool } from '../db.ts'
import { logger } from '../logger.ts'

interface AuthTokenRow extends RowDataPacket {
    auth_token: string
    id_user: number
}

export const authRoutes = new Hono()

authRoutes.post('/auth/permanentUserToken/', async (c) => {
    const pool = getPool()

    try {
        const [existsRows] = await pool.query<RowDataPacket[]>(
            'SELECT EXISTS (SELECT 1 FROM authToken) AS existsToken',
        )
        if (Number(existsRows[0]?.existsToken) !== 0)
        return c.text('Permanent user token already exists', 409)

        const url = `https://${config.powens.domain}-sandbox.biapi.pro/2.0/auth/init`
        const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: config.powens.clientId,
            client_secret: config.powens.clientSecret,
        }),
        })

        if (!response.ok) {
            logger.error('Powens auth init failed', { status: response.statusText })
            return c.body(null, 500)
        }

        const authToken = (await response.json()) as AuthTokenRow

        await pool.execute(
            'INSERT INTO authToken (auth_token, id_user) VALUES (?, ?)',
            [authToken.auth_token, authToken.id_user],
        )

        return c.json(authToken, 201)
    } catch (error) {
        logger.error('Failed to create permanent user token', { error: String(error) })
        return c.body(null, 500)
    }
})

authRoutes.get('/auth/permanentUserToken/', async (c) => {
    const pool = getPool()

    try {
        const [rows] = await pool.query<AuthTokenRow[]>(
            'SELECT auth_token, id_user FROM authToken LIMIT 1',
        )

        if (rows.length === 0) return c.text('Token does not exist', 404)

        return c.json(rows[0])
    } catch (error) {
        logger.error('Failed to fetch permanent user token', { error: String(error) })
        return c.body(null, 500)
    }
})

authRoutes.delete('/auth/permanentUserToken/', async (c) => {
    const pool = getPool()

    try {
        await pool.execute('DELETE FROM authToken')
        return c.body(null, 204)
    } catch (error) {
        logger.error('Failed to delete permanent user token', { error: String(error) })
        return c.body(null, 500)
    }
})
