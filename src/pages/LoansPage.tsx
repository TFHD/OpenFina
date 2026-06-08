import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { getLoans } from '../api/services'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { useAsyncLoad } from '../hooks/useAsyncLoad'
import { formatCurrency, formatDate, formatPercent } from '../lib/format'

export function LoansPage() {
  const { data: loans, loading, error, reload } = useAsyncLoad(
    getLoans,
    'Impossible de charger les crédits',
  )
  const [selectedIndex, setSelectedIndex] = useState(0)

  const loanList = loans ?? []
  const selected = loanList[selectedIndex] ?? loanList[0] ?? null

  return (
    <div>
      <PageHeader
        eyebrow="Crédits"
        title="Prêts et emprunts"
        description="Suivez vos crédits en cours et leurs échéances."
        action={
          <Button
            variant="secondary"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => {
              setSelectedIndex(0)
              void reload()
            }}
          >
            Actualiser
          </Button>
        }
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void reload()} />
      ) : loanList.length === 0 ? (
        <Card>
          <EmptyState message="Aucun crédit enregistré pour le moment." />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card title="Liste des crédits">
            <div className="space-y-2">
              {loanList.map((loan, index) => (
                <button
                  key={`${loan.account_label}-${index}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                    selectedIndex === index
                      ? 'border-brand-200 bg-brand-50'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-gray-900">{loan.account_label || 'Crédit'}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatCurrency(loan.total_amount)} · {loan.type}
                  </p>
                </button>
              ))}
            </div>
          </Card>

          {selected && (
            <Card title="Détail">
              <dl className="grid gap-4 text-sm">
                <Detail label="Montant total" value={formatCurrency(selected.total_amount)} />
                <Detail label="Montant utilisé" value={formatCurrency(selected.used_amount)} />
                <Detail label="Montant disponible" value={formatCurrency(selected.available_amount)} />
                <Detail label="Taux" value={formatPercent(selected.rate)} />
                <Detail label="Durée" value={`${selected.duration} mois`} />
                <Detail label="Souscription" value={formatDate(selected.subscription_date)} />
                <Detail label="Échéance" value={formatDate(selected.maturity_date)} />
                <Detail
                  label="Prochaine mensualité"
                  value={formatCurrency(selected.next_payment_amount)}
                />
                <Detail
                  label="Date prochain paiement"
                  value={formatDate(selected.next_payment_date)}
                />
                <Detail
                  label="Paiements restants"
                  value={`${selected.nb_payments_left} / ${selected.nb_payments_total}`}
                />
              </dl>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-50 pb-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  )
}
