import { Hono } from 'hono'
import { getPool } from '../db.ts'
import { logger } from '../logger.ts'

interface Currency {
  id: string
}

interface TransactionPayload {
    id: number
    id_account: number
    date: string
    value: number
    type: string
    original_wording: string
}

interface InvestmentPayload {
    id: number
    id_account: number
    label: string
    code: string
    code_type: string
    stock_symbol: string
    quantity: number
    unitprice: number
    unitvalue: number
    valuation: number
    diff: number
    diff_percent: number
    last_update: string
}

interface LoanPayload {
    total_amount: number
    available_amount: number
    used_amount: number
    subscription_date: string
    maturity_date: string
    start_repayment_date: string
    deferred: boolean
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
    type: string
}

interface AccountPayload {
    id: number
    id_user: number
    number: string
    original_name: string
    balance: number
    last_update: string
    iban: string
    currency: Currency
    type: string
    usage: string
    loan: LoanPayload
    investments: InvestmentPayload[]
    transactions: TransactionPayload[]
}

interface ConnectionSyncedPayload {
    connection: {
        connector: { name: string }
        accounts: AccountPayload[]
    }
}

function monthsBetween(start: string, end: string): number {
    const t1 = new Date(start)
    const t2 = new Date(end)
    const yearT1 = t1.getFullYear()
    const monthT1 = t1.getMonth() + 1
    const yearT2 = t2.getFullYear()
    const monthT2 = t2.getMonth() + 1
    return (yearT1 - yearT2) * 12 + monthT1 - monthT2
}

function normalizeLoan(loan: LoanPayload): LoanPayload {
    const normalized = { ...loan }

    if (normalized.nb_payments_total === 0) {
        normalized.nb_payments_total = monthsBetween(
            normalized.maturity_date,
            normalized.subscription_date,
        )
        logger.trace('Manually calculated Nb_payments_total', {
            value: normalized.nb_payments_total,
        })
    }

    if (normalized.nb_payments_done === 0) {
        normalized.nb_payments_done =
        normalized.nb_payments_total - normalized.nb_payments_left
        logger.trace('Manually calculated Nb_payments_done', {
            value: normalized.nb_payments_done,
        })
    }

    if (normalized.total_amount < 0) {
        normalized.total_amount = -normalized.total_amount
        logger.trace('Total_amount was negative. Reverted')
    }

    if (normalized.duration === 0) {
        normalized.duration = normalized.nb_payments_total
        logger.trace('Duration was not set. Set with Nb_payments_total value')
    }

    return normalized
}

export const webhookRoutes = new Hono()

webhookRoutes.post('/webhook/connection_synced/', async (c) => {
    const pool = getPool()

    try {
        const payload = await c.req.json<ConnectionSyncedPayload>()
        const connectorName = payload.connection.connector.name

        for (const account of payload.connection.accounts) {
            logger.trace('Account update', {
                connector_name: connectorName,
                account_id: account.id,
                account_name: account.original_name,
            })

            await pool.execute(
                `INSERT INTO bankAccount
                (account_id, user_id, bank_original_name, bank_number, original_name, balance, last_update, iban, currency, account_type, usage_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE balance=?, last_update=?, bank_original_name=?`,
                [
                account.id,
                account.id_user,
                connectorName,
                account.number,
                account.original_name,
                account.balance,
                account.last_update,
                account.iban,
                account.currency.id,
                account.type,
                account.usage,
                account.balance,
                account.last_update,
                connectorName,
                ],
            )

            await pool.execute(
                'INSERT INTO historyValue (bank_account_id, valuation, date_valuation) VALUES (?, ?, ?)',
                [account.id, account.balance, account.last_update],
            )

            if (account.loan?.total_amount) {
                const loan = normalizeLoan(account.loan)

                await pool.execute(
                `INSERT INTO loan
                    (loan_account_id, total_amount, available_amount, used_amount, subscription_date, maturity_date,
                    start_repayment_date, is_deferred, next_payment_amount, next_payment_date, rate, nb_payments_left,
                    nb_payments_done, nb_payments_total, last_payment_amount, last_payment_date, account_label,
                    insurance_label, insurance_amount, insurance_rate, duration, loan_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    total_amount=?, available_amount=?, used_amount=?, next_payment_amount=?, next_payment_date=?,
                    nb_payments_left=?, nb_payments_done=?, nb_payments_total=?, duration=?`,
                [
                    account.id,
                    loan.total_amount,
                    loan.available_amount,
                    loan.used_amount,
                    loan.subscription_date,
                    loan.maturity_date,
                    loan.start_repayment_date,
                    loan.deferred,
                    loan.next_payment_amount,
                    loan.next_payment_date,
                    loan.rate,
                    loan.nb_payments_left,
                    loan.nb_payments_done,
                    loan.nb_payments_total,
                    loan.last_payment_amount,
                    loan.last_payment_date,
                    loan.account_label,
                    loan.insurance_label,
                    loan.insurance_amount,
                    loan.insurance_rate,
                    loan.duration,
                    loan.type,
                    loan.total_amount,
                    loan.available_amount,
                    loan.used_amount,
                    loan.next_payment_amount,
                    loan.next_payment_date,
                    loan.nb_payments_left,
                    loan.nb_payments_done,
                    loan.nb_payments_total,
                    loan.duration,
                ],
                )
            }

            if (account.transactions?.length) {
                const placeholders: string[] = []
                const values: Array<string | number> = []

                for (const tx of account.transactions) {
                    placeholders.push('(?, ?, ?, ?, ?, ?, ?)')
                    values.push(
                        tx.id,
                        account.id_user,
                        tx.id_account,
                        tx.date,
                        tx.value,
                        tx.type,
                        tx.original_wording,
                    )
                }

                await pool.execute(
                    `INSERT IGNORE INTO tx (tx_id, user_id, account_id, tx_date, tx_value, tx_type, original_wording)
                    VALUES ${placeholders.join(',')}`,
                    values,
                )
            }

            if (account.investments?.length) {
                const placeholders: string[] = []
                const values: Array<string | number> = []

                for (const invest of account.investments) {
                placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                values.push(
                    invest.id,
                    invest.id_account,
                    invest.label,
                    invest.code,
                    invest.code_type,
                    invest.stock_symbol,
                    invest.quantity,
                    invest.unitprice,
                    invest.unitvalue,
                    invest.valuation,
                    invest.diff,
                    invest.diff_percent,
                    invest.last_update,
                )
                }

                await pool.execute(
                `INSERT INTO invest
                    (invest_id, account_id, invest_label, invest_code, invest_code_type, stock_symbol, quantity,
                    unit_price, unit_value, valuation, diff, diff_percent, last_update)
                    VALUES ${placeholders.join(',')}
                    AS new(a, b, c, d, e, f, Nquantity, Nunit_price, Nunit_value, Nvaluation, Ndiff, Ndiff_percent, Nlast_update)
                    ON DUPLICATE KEY UPDATE
                    quantity=Nquantity, unit_price=Nunit_price, unit_value=Nunit_value, valuation=Nvaluation,
                    diff=Ndiff, diff_percent=Ndiff_percent, last_update=Nlast_update`,
                values,
                )
            }
        }

        return c.body(null, 204)
    } catch (error) {
        logger.error('Webhook connection_synced failed', { error: String(error) })
        return c.body(null, 500)
    }
})
