export interface BankAccount {
    id: number
    id_user: number
    number: string
    bank_original_name: string
    original_name: string
    balance: number
    last_update: string
    iban: string
    currency: string
    type: string
    error: string
    usage: string
}

export interface BankAccountSum {
    type: string
    value: number
}

export interface Investment {
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
    bank_original_name: string
    original_name: string
}

export interface HistoryValuePoint {
    Valuation: number
    DateValuation: string
}

export interface Loan {
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

export interface Transaction {
    id: number
    id_account: number
    id_user: number
    date: string
    value: number
    type: string
    original_wording: string
    categorie_id?: string
    pinned: boolean
}

export interface CategorizeTransactionsResponse {
    categorized: number
    remaining: number
    results: Array<{
        id: number
        categorie_id: string
    }>
}

export interface AuthToken {
    auth_token: string
    id_user: number
}

export type HistoryPeriod = 'all' | 'month' | 'year'

export const STOCKS_TYPES =
    'article83,capitalisation,crowdlending,lifeinsurance,madelin,market,pea,pee,per,perco,perp,rsp'
