import { useCallback, useEffect, useMemo, useState } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { RefreshCw, Sparkles, Trash2 } from 'lucide-react'
import {
  deleteTransaction,
  getAllTransactions,
  updateTransaction,
} from '../api/services'
import type { Transaction } from '../api/types'
import { CategorySelect } from '../components/transactions/CategorySelect'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import {
  computeExpenseBreakdown,
  computeExpenseTotal,
  currentMonthKey,
  filterTransactionsByMonth,
} from '../lib/expenseStats'
import {
  getExpenseCategoryColor,
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transactions"
        title="Historique des opérations"
        description="Visualisez vos dépenses par catégorie et consultez vos transactions."
        action={
          <div className="flex gap-2">
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
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span
                  className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700"
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
              <p className="text-sm text-red-600">{categorizeError}</p>
              <p className="mt-2 text-sm text-gray-600">
                Les transactions déjà catégorisées sont conservées. Relancez
                l&apos;analyse pour continuer.
              </p>
            </Card>
          ) : null}

          {uncategorizedCount > 0 && !categorizing ? (
            <Card title="Catégorisation incomplète">
              <p className="text-sm text-gray-600">
                {uncategorizedCount} dépense
                {uncategorizedCount > 1 ? 's' : ''} sans catégorie. Cliquez sur
                « Catégoriser » pour reprendre l&apos;analyse.
              </p>
            </Card>
          ) : null}

          <Card
            title="Dépenses par catégorie"
            action={
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <span>Mois</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => {
                    setSelectedMonth(event.target.value)
                    setSelectedCategory(null)
                  }}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
                />
              </label>
            }
          >
            {expenseSlices.length === 0 ? (
              <EmptyState message="Aucune dépense catégorisée pour ce mois." />
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <div className="expense-chart h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseSlices}
                        dataKey="amount"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={120}
                        paddingAngle={2}
                        activeShape={false}
                        style={{ cursor: 'pointer' }}
                        onClick={(_, index) => {
                          const category = expenseSlices[index]?.category
                          if (category) toggleCategory(category)
                        }}
                      >
                        {expenseSlices.map((slice) => (
                          <Cell
                            key={slice.category}
                            fill={getExpenseCategoryColor(slice.category)}
                            stroke={
                              selectedCategory === slice.category
                                ? '#1f2937'
                                : 'transparent'
                            }
                            strokeWidth={selectedCategory === slice.category ? 2 : 0}
                            opacity={
                              selectedCategory &&
                              selectedCategory !== slice.category
                                ? 0.35
                                : 1
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) =>
                          formatCurrency(typeof value === 'number' ? value : 0)
                        }
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  <StatCard
                    label="Total des dépenses"
                    value={formatCurrency(expenseTotal)}
                  />
                  <div className="space-y-2">
                    {expenseSlices.map((slice) => (
                      <button
                        key={slice.category}
                        type="button"
                        onClick={() => toggleCategory(slice.category)}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                          selectedCategory === slice.category
                            ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/30'
                            : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: getExpenseCategoryColor(
                                slice.category,
                              ),
                            }}
                          />
                          <span className="font-medium text-gray-900">
                            {slice.label}
                          </span>
                        </div>
                        <span className="font-medium text-gray-700">
                          {formatCurrency(slice.amount)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card title={`Transactions de ${formatMonthLabel(selectedMonth)}`}>
            {monthTransactions.length === 0 ? (
              <EmptyState message="Aucune transaction pour ce mois." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-3 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">Montant</th>
                      <th className="px-3 py-3 font-medium">Catégorie</th>
                      <th className="px-3 py-3 font-medium">Libellé</th>
                      <th className="px-3 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
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
                        className={`transition-colors hover:bg-gray-50/80 ${
                          isHighlighted
                            ? 'bg-brand-50 ring-1 ring-inset ring-brand-500/40'
                            : ''
                        } ${isDimmed ? 'opacity-40' : ''}`}
                      >
                        <td className="px-3 py-3 text-gray-600">
                          {formatDate(tx.date)}
                        </td>
                        <td
                          className={`px-3 py-3 font-medium ${
                            tx.value > 0 ? 'text-emerald-600' : 'text-red-500'
                          }`}
                        >
                          {formatCurrency(tx.value)}
                        </td>
                        <td className="px-3 py-3 text-gray-600">
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
                        <td className="px-3 py-3 text-gray-700">
                          {tx.original_wording}
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => void remove(tx)}
                            className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
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
