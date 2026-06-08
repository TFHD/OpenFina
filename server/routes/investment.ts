import { Hono } from 'hono'
import type { RowDataPacket } from 'mysql2'
import { getPool } from '../db.ts'
import { normalizeDateValue } from '../lib/dates.ts'
import {
    aggregateHistoryPoints,
    historyPointsForAccount,
    type HistoryValue,
} from '../lib/history.ts'
import { logger } from '../logger.ts'

interface InvestmentRow extends RowDataPacket {
    invest_id: number
    account_id: number
    invest_label: string
    invest_code: string
    invest_code_type: string
    stock_symbol: string
    quantity: number
    unit_price: number
    unit_value: number
    valuation: number
    diff: number
    diff_percent: number
    last_update: string
    bank_original_name: string
    original_name: string
}

interface HistoryRow extends RowDataPacket {
    bank_account_id: number
    valuation: number
    date_valuation: string | Date
}

function mapInvestment(row: InvestmentRow) {
    return {
        id: row.invest_id,
        id_account: row.account_id,
        label: row.invest_label,
        code: row.invest_code,
        code_type: row.invest_code_type,
        stock_symbol: row.stock_symbol,
        quantity: row.quantity,
        unitprice: row.unit_price,
        unitvalue: row.unit_value,
        valuation: row.valuation,
        diff: row.diff,
        diff_percent: row.diff_percent,
        last_update: row.last_update,
        bank_original_name: row.bank_original_name,
        original_name: row.original_name,
    }
}

function mapHistoryRows(rows: HistoryRow[]): HistoryValue[] {
    return rows.map((row) => ({
        bankAccountId: row.bank_account_id,
        valuation: row.valuation,
        dateValuation: normalizeDateValue(row.date_valuation),
    }))
}

function periodCutoff(period: string): Date | null {
    const now = new Date()
    if (period === 'month')
        return new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000)
    if (period === 'year')
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    return null
}

export const investmentRoutes = new Hono()

investmentRoutes.get('/investment/', async (c) => {
    const pool = getPool()

    try {
        const [rows] = await pool.query<InvestmentRow[]>(
        `SELECT invest.invest_id, invest.account_id, invest.invest_label, invest.invest_code,
            invest.invest_code_type, invest.stock_symbol, invest.quantity, invest.unit_price,
            invest.unit_value, invest.valuation, invest.diff, invest.diff_percent, invest.last_update,
            bankAccount.bank_original_name, bankAccount.original_name
            FROM invest
            INNER JOIN bankAccount ON invest.account_id = bankAccount.account_id
            ORDER BY valuation DESC`,
        )

        return c.json(rows.map(mapInvestment))
    } catch (error) {
        logger.error('Failed to fetch investments', { error: String(error) })
        return c.body(null, 500)
    }
})

investmentRoutes.get('/history/', async (c) => {
    const pool = getPool()
    const period = c.req.query('period') ?? 'all'
    const accountTypes = (c.req.query('type') ?? '').split(',').filter(Boolean)
    const cutoff = periodCutoff(period)

    try {
        let query = 'SELECT historyValue.bank_account_id, historyValue.valuation, historyValue.date_valuation FROM historyValue INNER JOIN bankAccount ON historyValue.bank_account_id = bankAccount.account_id'

        const args: Array<string | Date> = []

        if (accountTypes.length > 0) {
            query += ` AND (${accountTypes.map(() => 'bankAccount.account_type=?').join(' OR ')})`
            args.push(...accountTypes)
        }

        if (cutoff) {
            query += ' WHERE historyValue.date_valuation > ?'
            args.push(cutoff)
        }

        query += ' ORDER BY historyValue.date_valuation'

        const [rows] = await pool.query<HistoryRow[]>(query, args)
        const historyValues = mapHistoryRows(rows)

        if (historyValues.length === 0) return c.body(null, 204)

        return c.json(aggregateHistoryPoints(historyValues))
    } catch (error) {
        logger.error('Failed to fetch history values', { error: String(error) })
        return c.body(null, 500)
    }
})

investmentRoutes.get('/history/:id', async (c) => {
    const pool = getPool()
    const bankAccountId = Number(c.req.param('id'))
    const period = c.req.query('period') ?? 'all'
    const cutoff = periodCutoff(period)

    if (Number.isNaN(bankAccountId)) {
        logger.error('Cannot convert id parameter from str to int')
        return c.body(null, 500)
    }

    try {
        let query = 'SELECT bank_account_id, valuation, date_valuation FROM historyValue WHERE bank_account_id = ?'
        const args: Array<number | Date> = [bankAccountId]

        if (cutoff) {
            query += ' AND date_valuation > ?'
            args.push(cutoff)
        }

        query += ' ORDER BY date_valuation'

        const [rows] = await pool.query<HistoryRow[]>(query, args)
        const historyValues = mapHistoryRows(rows)

        if (historyValues.length === 0) return c.body(null, 204)

        return c.json(historyPointsForAccount(bankAccountId, historyValues))
    } catch (error) {
        logger.error('Failed to fetch history value', { error: String(error) })
        return c.body(null, 500)
    }
})
