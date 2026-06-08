import type { Transaction } from '../api/types'
import { parseBackendDate } from './format'
import {
    getExpenseCategoryLabel,
    resolveCategory,
    type ExpenseCategoryId,
} from './expenseCategories'

interface ExpenseSlice {
    category: ExpenseCategoryId
    label: string
    amount: number
}

export function currentMonthKey(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getTransactionMonth(date: string): string | null {
    const parsed = parseBackendDate(date)
    if (!parsed) return null
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`
}

export function filterTransactionsByMonth(
    transactions: Transaction[],
    month: string,
): Transaction[] {
    return transactions.filter((tx) => getTransactionMonth(tx.date) === month)
}

export function computeExpenseBreakdown(
    transactions: Transaction[],
    month: string,
): ExpenseSlice[] {
    const totals = new Map<ExpenseCategoryId, number>()

    for (const tx of transactions) {
        if (tx.value >= 0) continue
        if (getTransactionMonth(tx.date) !== month) continue

        const category = resolveCategory(tx)
        if (!category) continue

        totals.set(category, (totals.get(category) ?? 0) + Math.abs(tx.value))
    }

    return [...totals.entries()]
        .map(([category, amount]) => ({
            category,
            label: getExpenseCategoryLabel(category),
            amount,
        }))
        .sort((a, b) => b.amount - a.amount)
}

export function computeExpenseTotal(slices: ExpenseSlice[]): number {
    return slices.reduce((sum, slice) => sum + slice.amount, 0)
}
