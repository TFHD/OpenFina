import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Sparkles, Trash2 } from 'lucide-react'
import {
  deleteTransaction,
  getAllTransactions,
  updateTransaction,
} from '../api/services'
import type { Transaction } from '../api/types'
import { CashflowChart } from '../components/transactions/CashflowChart'
import { CashflowSummary } from '../components/transactions/CashflowSummary'
import { ExpenseDistribution } from '../components/transactions/ExpenseDistribution'
import { CategorySelect } from '../components/transactions/CategorySelect'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import {
  computeCashflowSummary,
  computeExpenseBreakdown,
  computeExpenseTotal,
  computeIncomeTotal,
  currentMonthKey,
  filterTransactionsByMonth,
} from '../lib/expenseStats'
import {
  resolveCategory,
  type ExpenseCategoryId,
} from '../lib/expenseCategories'
import { formatCurrency, formatDate } from '../lib/format'
import {
  categorizeUncategorizedTransactions,
  countUncategorizedExpenses,
} from '../lib/transactionCategorization'

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey)
  const [loading, setLoading] = useState(true)
  const [categorizing, setCategorizing] = useState(false)
  const [categorizeRemaining, setCategorizeRemaining] = useState(0)
  const [categorizeError, setCategorizeError] = useState<string | null>(null)
  const [savingCategoryId, setSavingCategoryId] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] =
    useState<ExpenseCategoryId | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    return getAllTransactions()
  }, [])

  const runCategorization = useCallback(async () => {
    if (countUncategorizedExpenses(transactions) === 0) return

    setCategorizing(true)
    setCategorizeError(null)
    setCategorizeRemaining(countUncategorizedExpenses(transactions))

    try {
      setTransactions(
        await categorizeUncategorizedTransactions({
          fetchTransactions,
          onProgress: setCategorizeRemaining,
          onBatchComplete: setTransactions,
        }),
      )
    } catch (err) {
      setCategorizeError(
        err instanceof Error
          ? err.message
          : 'Impossible de catégoriser les transactions',
      )
    } finally {
      setCategorizing(false)
    }
  }, [fetchTransactions, transactions])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const data = await fetchTransactions()
        if (cancelled) return

        setTransactions(data)
        setError(null)
        setLoading(false)

        if (countUncategorizedExpenses(data) > 0) {
          setCategorizing(true)
          setCategorizeRemaining(countUncategorizedExpenses(data))

          try {
            const updated = await categorizeUncategorizedTransactions({
              fetchTransactions,
              onProgress: (remaining) => {
                if (!cancelled) setCategorizeRemaining(remaining)
              },
              onBatchComplete: (transactions) => {
                if (!cancelled) setTransactions(transactions)
              },
              isCancelled: () => cancelled,
            })
            if (!cancelled) setTransactions(updated)
          } catch (err) {
            if (!cancelled) {
              setCategorizeError(
                err instanceof Error
                  ? err.message
                  : 'Impossible de catégoriser les transactions',
              )
            }
          } finally {
            if (!cancelled) {
              setCategorizing(false)
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Impossible de charger les transactions',
          )
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [fetchTransactions])

  const monthTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, selectedMonth),
    [transactions, selectedMonth],
  )

  const expenseSlices = useMemo(
    () => computeExpenseBreakdown(transactions, selectedMonth),
    [transactions, selectedMonth],
  )

  const expenseTotal = useMemo(
    () => computeExpenseTotal(expenseSlices),
    [expenseSlices],
  )

  const cashflowSummary = useMemo(
    () => computeCashflowSummary(transactions, selectedMonth),
    [transactions, selectedMonth],
  )

  const incomeTotal = useMemo(
    () => computeIncomeTotal(transactions, selectedMonth),
    [transactions, selectedMonth],
  )

  const toggleCategory = (category: ExpenseCategoryId) => {
    setSelectedCategory((current) =>
      current === category ? null : category,
    )
  }

  const uncategorizedCount = useMemo(
    () => countUncategorizedExpenses(transactions),
    [transactions],
  )

  const remove = async (tx: Transaction) => {
    if (!window.confirm('Supprimer cette transaction ?')) return
    await deleteTransaction(tx.id)
    setTransactions((current) => current.filter((item) => item.id !== tx.id))
  }

  const changeCategory = async (
    tx: Transaction,
    categoryId: ExpenseCategoryId,
  ) => {
    setSavingCategoryId(tx.id)
    setCategorizeError(null)

    try {
      await updateTransaction({ ...tx, categorie_id: categoryId })
      setTransactions((current) =>
        current.map((item) =>
          item.id === tx.id ? { ...item, categorie_id: categoryId } : item,
        ),
      )
    } catch (err) {
      setCategorizeError(
        err instanceof Error
          ? err.message
          : 'Impossible de mettre à jour la catégorie',
      )
    } finally {
      setSavingCategoryId(null)
    }
  }

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchTransactions()
      setTransactions(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de charger les transactions',
      )
    } finally {
      setLoading(false)
    }
  }

  const monthPicker = (
    <input
      type="month"
      value={selectedMonth}
      onChange={(event) => {
        setSelectedMonth(event.target.value)
        setSelectedCategory(null)
      }}
      className="rounded-xl border border-white/10 bg-surface-hover px-3 py-2 text-sm text-gray-200 outline-none ring-brand-500 focus:ring-2"
    />
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Budget"
        title="Transactions"
        description="Suivez vos flux de trésorerie et vos dépenses par catégorie."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {monthPicker}
            {uncategorizedCount > 0 ? (
              <Button
                variant="secondary"
                icon={<Sparkles className="h-4 w-4" />}
                onClick={() => void runCategorization()}
                disabled={loading || categorizing}
              >
                Catégoriser
              </Button>
            ) : null}
            <Button
              variant="secondary"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={() => void refresh()}
              disabled={loading || categorizing}
            >
              Actualiser
            </Button>
          </div>
        }
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refresh()} />
      ) : (
        <>
          {categorizing ? (
            <Card title="Catégorisation en cours">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span
                  className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500"
                  aria-hidden="true"
                />
                <p>
                  Analyse des dépenses avec Qwen (Ollama)…{' '}
                  {categorizeRemaining > 0
                    ? `${categorizeRemaining} restante${categorizeRemaining > 1 ? 's' : ''}`
                    : 'finalisation'}
                </p>
              </div>
            </Card>
          ) : null}

          {categorizeError ? (
            <Card title="Erreur de catégorisation">
              <p className="text-sm text-red-400">{categorizeError}</p>
              <p className="mt-2 text-sm text-gray-400">
                Les transactions déjà catégorisées sont conservées. Relancez
                l&apos;analyse pour continuer.
              </p>
            </Card>
          ) : null}

          {uncategorizedCount > 0 && !categorizing ? (
            <Card title="Catégorisation incomplète">
              <p className="text-sm text-gray-400">
                {uncategorizedCount} dépense
                {uncategorizedCount > 1 ? 's' : ''} sans catégorie. Cliquez sur
                « Catégoriser » pour reprendre l&apos;analyse.
              </p>
            </Card>
          ) : null}

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
            <Card title="Cashflow" className="order-1 lg:col-start-1">
              <CashflowSummary summary={cashflowSummary} />
              <CashflowChart income={incomeTotal} expenses={expenseSlices} />
            </Card>

            <aside className="order-2 w-full lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
              <ExpenseDistribution
                slices={expenseSlices}
                total={expenseTotal}
                selectedCategory={selectedCategory}
                onSelectCategory={toggleCategory}
              />
            </aside>

            <Card
              title={`Opérations — ${formatMonthLabel(selectedMonth)}`}
              className="order-3 min-w-0 lg:col-start-1"
            >
                {monthTransactions.length === 0 ? (
                  <EmptyState message="Aucune transaction pour ce mois." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-white/5 text-xs uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-3 py-3 font-medium">Date</th>
                          <th className="px-3 py-3 font-medium">Montant</th>
                          <th className="px-3 py-3 font-medium">Catégorie</th>
                          <th className="px-3 py-3 font-medium">Libellé</th>
                          <th className="px-3 py-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {monthTransactions.map((tx) => {
                          const category = resolveCategory(tx)
                          const isHighlighted =
                            selectedCategory !== null &&
                            tx.value < 0 &&
                            category === selectedCategory
                          const isDimmed =
                            selectedCategory !== null &&
                            tx.value < 0 &&
                            category !== selectedCategory

                          return (
                            <tr
                              key={tx.id}
                              className={`transition-colors hover:bg-white/5 ${
                                isHighlighted
                                  ? 'bg-brand-50 ring-1 ring-inset ring-brand-500/30'
                                  : ''
                              } ${isDimmed ? 'opacity-40' : ''}`}
                            >
                              <td className="px-3 py-3 text-gray-500">
                                {formatDate(tx.date)}
                              </td>
                              <td
                                className={`px-3 py-3 font-medium ${
                                  tx.value > 0
                                    ? 'text-emerald-400'
                                    : 'text-red-400'
                                }`}
                              >
                                {formatCurrency(tx.value)}
                              </td>
                              <td className="px-3 py-3 text-gray-500">
                                {tx.value < 0 ? (
                                  <CategorySelect
                                    value={resolveCategory(tx) ?? ''}
                                    disabled={savingCategoryId === tx.id}
                                    onChange={(categoryId) =>
                                      void changeCategory(tx, categoryId)
                                    }
                                  />
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="px-3 py-3 text-gray-300">
                                {tx.original_wording}
                              </td>
                              <td className="px-3 py-3">
                                <button
                                  type="button"
                                  onClick={() => void remove(tx)}
                                  className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-500/10"
                                  aria-label="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
          </div>
        </>
      )}
    </div>
  )
}

function formatMonthLabel(month: string): string {
  const [year, monthIndex] = month.split('-').map(Number)
  if (!year || !monthIndex) return month
  return new Date(year, monthIndex - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
}
