import { Hono } from 'hono'
import type { RowDataPacket } from 'mysql2'
import { getPool } from '../db.ts'
import { scanCategorieId } from '../lib/categories.ts'
import { formatDateTimeForMysql } from '../lib/dates.ts'
import { logger } from '../logger.ts'

interface TransactionRow extends RowDataPacket {
    tx_id: number
    user_id: number
    account_id: number
    tx_date: string | Date
    tx_value: number
    tx_type: string
    original_wording: string
    categorie_id: string | null
    pinned: boolean
}

function mapTransaction(row: TransactionRow) {
    return {
        id: row.tx_id,
        id_account: row.account_id,
        id_user: row.user_id,
        date: formatDateTimeForMysql(row.tx_date),
        value: row.tx_value,
        type: row.tx_type,
        original_wording: row.original_wording,
        categorie_id: scanCategorieId(row.categorie_id),
        pinned: Boolean(row.pinned),
    }
}

export const transactionRoutes = new Hono()

transactionRoutes.post('/transaction/', async (c) => {
    const pool = getPool()

    try {
        const tx = await c.req.json<{
            id: number
            id_user: number
            id_account: number
            date: string
            value: number
            type: string
            original_wording: string
        }>()

        await pool.execute(
            'INSERT INTO tx (tx_id, user_id, account_id, tx_date, tx_value, tx_type, original_wording) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                tx.id,
                tx.id_user,
                tx.id_account,
                formatDateTimeForMysql(tx.date),
                tx.value,
                tx.type,
                tx.original_wording,
            ],
        )

        return c.body(null, 204)
    } catch (error) {
        return c.text(String(error), 400)
    }
})

transactionRoutes.get('/transaction/', async (c) => {
    const pool = getPool()
    const page = Math.max(1, Number(c.req.query('page') ?? 1) || 1)
    const limitRaw = Number(c.req.query('limit') ?? 50) || 50
    const limit = Math.min(Math.max(1, limitRaw), 50)
    const offset = (page - 1) * limit

    try {
        const [rows] = await pool.query<TransactionRow[]>(
            `SELECT tx_id, user_id, account_id, tx_date, tx_value, tx_type,
                original_wording, categorie_id, pinned
                FROM tx ORDER BY tx_date DESC LIMIT ? OFFSET ?`,
            [limit, offset],
        )

        return c.json(rows.map(mapTransaction))
    } catch (error) {
        logger.error('Failed to fetch transactions', { error: String(error) })
        return c.text(String(error), 500)
    }
})

transactionRoutes.put('/transaction/:id', async (c) => {
    const pool = getPool()
    const txId = c.req.param('id')

    try {
            const tx = await c.req.json<{
            date: string
            value: number
            type: string
            original_wording: string
            categorie_id?: string
            pinned: boolean
        }>()

        const categorieId = tx.categorie_id?.trim() ? tx.categorie_id : null

        await pool.execute(
            'UPDATE tx SET tx_date=?, tx_value=?, tx_type=?, original_wording=?, categorie_id=?, pinned=? WHERE tx_id=?',
            [
                formatDateTimeForMysql(tx.date),
                tx.value,
                tx.type,
                tx.original_wording,
                categorieId,
                tx.pinned,
                txId,
            ],
        )

        return c.body(null, 204)
    } catch (error) {
        logger.error('Failed to update transaction', { error: String(error) })
        return c.text(String(error), 500)
    }
})

transactionRoutes.delete('/transaction/:id', async (c) => {
    const pool = getPool()
    const txId = c.req.param('id')

    try {
        await pool.execute('DELETE FROM tx WHERE tx_id=?', [txId])
        return c.body(null, 204)
    } catch (error) {
        logger.error('Failed to delete transaction', { error: String(error) })
        return c.text(String(error), 500)
    }
})
