import {
    categorizeAllUncategorizedTransactions,
    getAllTransactions,
} from '../api/services'
import type { Transaction } from '../api/types'
import { isUncategorizedExpense } from './expenseCategories'

interface CategorizationOptions {
    fetchTransactions?: () => Promise<Transaction[]>
    onProgress?: (remaining: number) => void
    onBatchComplete?: (transactions: Transaction[]) => void
    isCancelled?: () => boolean
}

export function countUncategorizedExpenses(transactions: Transaction[]): number {
    return transactions.filter(isUncategorizedExpense).length
}

export async function categorizeUncategorizedTransactions(
    options: CategorizationOptions = {},
): Promise<Transaction[]> {
    const fetchTransactions = options.fetchTransactions ?? getAllTransactions

    await categorizeAllUncategorizedTransactions({
        onProgress: (remaining) => {
            if (options.isCancelled?.()) return options.onProgress?.(remaining)
        },
        onBatchComplete: async () => {
            if (options.isCancelled?.()) return options.onBatchComplete?.(await fetchTransactions())
        },
    })

    return fetchTransactions()
}
