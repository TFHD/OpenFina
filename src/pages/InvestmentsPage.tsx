import { useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { getInvestments } from '../api/services'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { useAsyncLoad } from '../hooks/useAsyncLoad'
import { formatCurrency, formatPercent } from '../lib/format'

export function InvestmentsPage() {
  const { data: investments, loading, error, reload } = useAsyncLoad(
    getInvestments,
    'Impossible de charger les investissements',
  )

  const items = investments ?? []

  const total = useMemo(
    () => items.reduce((acc, item) => acc + item.valuation, 0),
    [items],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>()
    for (const invest of items) {
      const key = invest.original_name || invest.bank_original_name || 'Autre'
      const list = map.get(key) ?? []
      list.push(invest)
      map.set(key, list)
    }
    return [...map.entries()]
  }, [items])

  return (
    <div>
      <PageHeader
        eyebrow="Actifs"
        title="Actions & fonds"
        description="Portefeuille d'investissements synchronisé depuis Powens."
        action={
          <Button
            variant="secondary"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => void reload()}
          >
            Actualiser
          </Button>
        }
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void reload()} />
      ) : (
        <div className="space-y-6">
          <Card title="Résumé">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Valorisation totale" value={formatCurrency(total)} />
              <StatCard label="Lignes" value={String(items.length)} />
              <StatCard label="Comptes" value={String(grouped.length)} />
            </div>
          </Card>

          {grouped.length === 0 ? (
            <Card>
              <EmptyState message="Aucun investissement disponible." />
            </Card>
          ) : (
            grouped.map(([accountName, accountItems]) => (
              <Card key={accountName} title={accountName}>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-white/5 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-3 py-3 font-medium">Nom</th>
                        <th className="px-3 py-3 font-medium">Quantité</th>
                        <th className="px-3 py-3 font-medium">Prix unitaire</th>
                        <th className="px-3 py-3 font-medium">Valorisation</th>
                        <th className="px-3 py-3 font-medium">Performance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {accountItems.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5">
                          <td className="px-3 py-3 font-medium text-gray-200">{item.label}</td>
                          <td className="px-3 py-3 text-gray-500">{item.quantity}</td>
                          <td className="px-3 py-3 text-gray-500">
                            {formatCurrency(item.unitvalue)}
                          </td>
                          <td className="px-3 py-3 font-medium text-gray-100">
                            {formatCurrency(item.valuation)}
                          </td>
                          <td
                            className={`px-3 py-3 font-medium ${
                              item.diff_percent >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {formatPercent(item.diff_percent)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
