import { Hono } from 'hono'
import type { RowDataPacket } from 'mysql2'
import { getPool } from '../db.ts'
import { logger } from '../logger.ts'

const VALID_ACCOUNT_TYPES = new Set([
    'article83', 'capitalisation', 'card', 'checking',
    'crowdlending', 'deposit', 'ldds', 'lifeinsurance',
    'loan', 'madelin', 'market', 'pea', 'pee', 'per',
    'perco', 'perp', 'real_estate', 'rsp', 'savings', 'unknown',
])

interface BankAccountRow extends RowDataPacket {
    account_id: number
    user_id: number
    bank_original_name: string
    bank_number: string
    original_name: string
    balance: number
    last_update: string
    iban: string
    currency: string
    account_type: string
    usage_type: string
}

function mapAccount(row: BankAccountRow) {
    return {
        id: row.account_id,
        id_user: row.user_id,
        number: row.bank_number,
        bank_original_name: row.bank_original_name,
        original_name: row.original_name,
        balance: row.balance,
        last_update: row.last_update,
        iban: row.iban,
        currency: row.currency,
        type: row.account_type,
        error: '',
        usage: row.usage_type,
    }
}

export const bankRoutes = new Hono()

bankRoutes.get('/bank_account/', async (c) => {
    const accountType = c.req.query('type')
    const pool = getPool()

    try {
        let rows: BankAccountRow[]

        if (!accountType) {
            const [result] = await pool.query<BankAccountRow[]>(
                'SELECT * FROM bankAccount ORDER BY original_name',
            )
            rows = result
        } else if (!VALID_ACCOUNT_TYPES.has(accountType)) {
            logger.warn('Unsupported Powens account type', { type: accountType })
            return c.text(
                'Unsupported account type. Must be: article83, capitalisation, card, checking,' +
                'crowdlending, deposit, ldds, lifeinsurance,' +
                'loan, madelin, market, pea, pee, per,' +
                'perco, perp, real_estate, rsp, savings, unknown',
                400,
            )
        } else {
            const [result] = await pool.query<BankAccountRow[]>(
                'SELECT * FROM bankAccount WHERE account_type=? ORDER BY balance DESC',
                [accountType],
            )
            rows = result
        }

        return c.json(rows.map(mapAccount))
    } catch (error) {
        logger.error('Failed to fetch bank accounts', { error: String(error) })
        return c.body(null, 500)
    }
})

bankRoutes.get('/bank_account/sum/', async (c) => {
    const pool = getPool()

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT account_type, SUM(balance) AS value FROM bankAccount GROUP BY account_type',
        )

        const grouped = [
            { type: 'Actions et fonds', value: 0 },
            { type: 'Comptes bancaires', value: 0 },
            { type: 'Livrets d\'épargne', value: 0 },
        ]

        for (const row of rows) {
            const accountType = String(row.account_type)
            const value = Number(row.value)

            if (
                ['article83', 'capitalisation', 'crowdlending', 'lifeinsurance', 'madelin', 'market', 'pea', 'pee', 'per', 'perco', 'perp', 'rsp'].includes(
                accountType,
                )
            ) grouped[0].value += value
            else if (accountType === 'checking') grouped[1].value += value
            else if (accountType === 'savings') grouped[2].value += value
        }

        return c.json(grouped)
    } catch (error) {
        logger.error('Failed to fetch bank account sums', { error: String(error) })
        return c.body(null, 500)
    }
})
