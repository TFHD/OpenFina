import { api } from './client'
import type {
    AuthToken,
    BankAccount,
    BankAccountSum,
    HistoryPeriod,
    HistoryValuePoint,
    Investment,
    Loan,
    CategorizeTransactionsResponse,
    Transaction,
} from './types'

function ensureArray<T>(data: T | T[] | undefined | null): T[] {
    if (data == null) return []
    return Array.isArray(data) ? data : [data]
}

export async function getVersion(): Promise<string> {
    return api.get<string>('/version/')
}

export async function getBankAccounts(type?: string): Promise<BankAccount[]> {
    const path = type
        ? `/bank_account/?type=${encodeURIComponent(type)}`
        : '/bank_account/'
    return ensureArray(await api.get<BankAccount[]>(path))
}

export async function getBankAccountSums(): Promise<BankAccountSum[]> {
    return ensureArray(await api.get<BankAccountSum[]>('/bank_account/sum/'))
}

export async function getInvestments(): Promise<Investment[]> {
    return ensureArray(await api.get<Investment[]>('/investment/'))
}

export async function getHistory(
    period: HistoryPeriod,
    type?: string,
): Promise<HistoryValuePoint[]> {
    const params = new URLSearchParams({ period })
    if (type) params.set('type', type)
    return ensureArray(await api.get<HistoryValuePoint[]>(`/history/?${params}`))
}

export async function getLoans(): Promise<Loan[]> {
    return ensureArray(await api.get<Loan[]>('/loan/'))
}

async function getTransactions(page = 1, limit = 50): Promise<Transaction[]> {
    return ensureArray(
        await api.get<Transaction[]>(`/transaction/?page=${page}&limit=${limit}`),
    )
}

export async function getAllTransactions(): Promise<Transaction[]> {
    const all: Transaction[] = []
    let page = 1

    while (true) {
        const batch = await getTransactions(page, 50)
        if (batch.length === 0) break
        all.push(...batch)
        if (batch.length < 50) break
        page += 1
    }

    return all
}

export async function updateTransaction(tx: Transaction): Promise<void> {
    await api.put<void>(`/transaction/${tx.id}`, tx)
}

export async function deleteTransaction(id: number): Promise<void> {
    await api.delete<void>(`/transaction/${id}`)
}

async function categorizeTransactions(
    limit = 0,
): Promise<CategorizeTransactionsResponse> {
    return api.post<CategorizeTransactionsResponse>('/transaction/categorize/', {
        limit,
    })
}

export async function categorizeAllUncategorizedTransactions(options?: {
    onProgress?: (remaining: number) => void
    onBatchComplete?: () => Promise<void>
    maxRounds?: number
}): Promise<number> {
    let total = 0
    const maxRounds = options?.maxRounds ?? 500

    for (let round = 0; round < maxRounds; round += 1) {
        const result = await categorizeTransactions()
        total += result.categorized
        options?.onProgress?.(result.remaining)

        if (options?.onBatchComplete) await options.onBatchComplete()
        if (result.remaining === 0 || result.categorized === 0) break
    }

    return total
}

export async function getPermanentUserToken(): Promise<AuthToken | null> {
    try {
        return await api.get<AuthToken>('/auth/permanentUserToken/')
    } catch (err) {
        if (err instanceof Error && 'status' in err && (err as { status: number }).status === 404)
        return null
        throw err
    }
}

export async function createPermanentUserToken(): Promise<AuthToken> {
    return api.post<AuthToken>('/auth/permanentUserToken/')
}

export async function getManageConnectionLink(): Promise<string> {
    return api.get<string>('/webview/manageConnectionLink/')
}
