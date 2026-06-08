import type { Transaction } from '../api/types'

const EXPENSE_CATEGORIES = {
    nourriture: 'Nourriture',
    abonnement: 'Abonnements',
    loisirs: 'Loisirs',
    transport: 'Transport',
    logement: 'Logement',
    sante: 'Santé',
    shopping: 'Shopping',
    banque: 'Banque & frais',
    credit: 'Crédits',
    autre: 'Autre',
} as const

export type ExpenseCategoryId = keyof typeof EXPENSE_CATEGORIES

const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategoryId, string> = {
    nourriture: '#f97316',
    abonnement: '#8b5cf6',
    loisirs: '#ec4899',
    transport: '#3b82f6',
    logement: '#ca8a04',
    sante: '#ef4444',
    shopping: '#06b6d4',
    banque: '#64748b',
    credit: '#991b1b',
    autre: '#9ca3af',
}

export function isExpenseCategoryId(value: string): value is ExpenseCategoryId {
    return value in EXPENSE_CATEGORIES
}

export function resolveCategory(tx: Transaction): ExpenseCategoryId | null {
    if (tx.categorie_id && isExpenseCategoryId(tx.categorie_id)) return tx.categorie_id
    return null
}

export function isUncategorizedExpense(tx: Transaction): boolean {
    return tx.value < 0 && resolveCategory(tx) === null
}

export function getExpenseCategoryLabel(category: ExpenseCategoryId): string {
    return EXPENSE_CATEGORIES[category]
}

export function getExpenseCategoryColor(category: ExpenseCategoryId): string {
    return EXPENSE_CATEGORY_COLORS[category]
}

export function getExpenseCategoryOptions(): Array<{
    id: ExpenseCategoryId
    label: string
}> {
    return (
        Object.entries(EXPENSE_CATEGORIES) as Array<[ExpenseCategoryId, string]>
    ).map(([id, label]) => ({ id, label }))
}
