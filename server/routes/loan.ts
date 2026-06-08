import { Hono } from 'hono'
import type { RowDataPacket } from 'mysql2'
import { getPool } from '../db.ts'
import { logger } from '../logger.ts'

interface LoanRow extends RowDataPacket {
    total_amount: number
    available_amount: number
    used_amount: number
    subscription_date: string
    maturity_date: string
    start_repayment_date: string
    is_deferred: boolean
    next_payment_amount: number
    next_payment_date: string
    rate: number
    nb_payments_left: number
    nb_payments_done: number
    nb_payments_total: number
    last_payment_amount: number
    last_payment_date: string
    account_label: string
    insurance_label: string
    insurance_amount: number
    insurance_rate: number
    duration: number
    loan_type: string
}

function mapLoan(row: LoanRow) {
    return {
        total_amount: row.total_amount,
        available_amount: row.available_amount,
        used_amount: row.used_amount,
        subscription_date: row.subscription_date,
        maturity_date: row.maturity_date,
        start_repayment_date: row.start_repayment_date,
        deferred: Boolean(row.is_deferred),
        next_payment_amount: row.next_payment_amount,
        next_payment_date: row.next_payment_date,
        rate: row.rate,
        nb_payments_left: row.nb_payments_left,
        nb_payments_done: row.nb_payments_done,
        nb_payments_total: row.nb_payments_total,
        last_payment_amount: row.last_payment_amount,
        last_payment_date: row.last_payment_date,
        account_label: row.account_label,
        insurance_label: row.insurance_label,
        insurance_amount: row.insurance_amount,
        insurance_rate: row.insurance_rate,
        duration: row.duration,
        type: row.loan_type,
    }
}

export const loanRoutes = new Hono()

loanRoutes.get('/loan/', async (c) => {
    const pool = getPool()

    try {
        const [rows] = await pool.query<LoanRow[]>('SELECT * FROM loan')
        return c.json(rows.map(mapLoan))
    } catch (error) {
        logger.error('Failed to fetch loans', { error: String(error) })
        return c.body(null, 500)
    }
})
