import mysql from 'mysql2/promise'
import { config } from './config.ts'
import { logger } from './logger.ts'

let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
    if (!pool) throw new Error('Database not initialized. Call initDb() first.')
    return pool
}

export async function initDb(): Promise<void> {
    if (pool) return

    pool = mysql.createPool({
        host: config.db.host,
        port: config.db.port,
        database: config.db.name,
        user: config.db.user,
        password: config.db.password,
        waitForConnections: true,
        connectionLimit: 10,
    })

    const connection = await pool.getConnection()
    try {
        await connection.ping()
        logger.info('Successfully pinged DB')
    } finally {
        connection.release()
    }
}

export async function closeDb(): Promise<void> {
    if (pool) {
        await pool.end()
        pool = null
    }
}
