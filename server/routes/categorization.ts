import { Hono } from 'hono'
import type { RowDataPacket } from 'mysql2'
import { config } from '../config.ts'
import { getPool } from '../db.ts'
import { isValidCategory } from '../lib/categories.ts'
import { categorizeWithOllama } from '../lib/ollama.ts'
import { logger } from '../logger.ts'

interface UncategorizedRow extends RowDataPacket {
    tx_id: number
    original_wording: string
    tx_type: string
}

async function fetchUncategorizedExpenses(limit: number) {
    const pool = getPool()
    const [rows] = await pool.query<UncategorizedRow[]>(
        'SELECT tx_id, original_wording, tx_type FROM tx WHERE categorie_id IS NULL AND tx_value < 0 ORDER BY tx_date DESC LIMIT ?',
        [limit],
    )

    return rows.map((row) => ({
        id: row.tx_id,
        original_wording: row.original_wording,
        transaction_type: row.tx_type,
    }))
}

async function countUncategorizedExpenses(): Promise<number> {
    const pool = getPool()
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT COUNT(*) AS count FROM tx WHERE categorie_id IS NULL AND tx_value < 0',
    )
    return Number(rows[0]?.count ?? 0)
}

export const categorizationRoutes = new Hono()

categorizationRoutes.post('/transaction/categorize/', async (c) => {
    const pool = getPool()

    try {
        let limit = 0
        const contentLength = c.req.header('content-length')
        if (contentLength && Number(contentLength) > 0) {
            const body = await c.req.json<{ limit?: number }>()
            limit = body.limit ?? 0
        }

        let batchSize = config.ollama.batchSize

        if (batchSize < 1) batchSize = 25
        if (limit > 0 && limit < batchSize) batchSize = limit

        const transactions = await fetchUncategorizedExpenses(batchSize)
        const results: Array<{ id: number; categorie_id: string }> = []

        if (transactions.length > 0) {
            const allowedIds = new Set(transactions.map((tx) => tx.id))
            const aiResults = await categorizeWithOllama(transactions)
            const assigned = new Map<number, string>()

            for (const result of aiResults) {
                if (!allowedIds.has(result.id)) continue
                assigned.set(
                result.id,
                isValidCategory(result.categorie_id) ? result.categorie_id : 'autre',
                )
            }

            for (const tx of transactions) {
                const category = assigned.get(tx.id) ?? 'autre'

                try {
                    await pool.execute(
                        'UPDATE tx SET categorie_id=? WHERE tx_id=? AND categorie_id IS NULL AND tx_value < 0',
                        [category, tx.id],
                    )
                    results.push({ id: tx.id, categorie_id: category })
                } catch (error) {
                    logger.error('Cannot update categorie_id', {
                        tx_id: tx.id,
                        error: String(error),
                    })
                }
            }
        }

        const remaining = await countUncategorizedExpenses()

        return c.json({
            categorized: results.length,
            remaining,
            results,
        })
    } catch (error) {
        logger.error('Ollama categorization failed', { error: String(error) })
        return c.text(String(error), 502)
    }
})
