import { useState } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import {
  createPermanentUserToken,
  getBankAccounts,
  getManageConnectionLink,
  getPermanentUserToken,
} from '../api/services'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { useAsyncLoad } from '../hooks/useAsyncLoad'
import { formatCurrency, formatDate, formatIban } from '../lib/format'

export function AccountsPage() {
  const { data: accounts, loading, error, reload } = useAsyncLoad(
    getBankAccounts,
    'Impossible de charger les comptes',
  )
  const [managing, setManaging] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleManagePowens = async () => {
    setManaging(true)
    setActionError(null)
    try {
      let token = await getPermanentUserToken()
      if (!token) {
        token = await createPermanentUserToken()
      }
      const url = await getManageConnectionLink()
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Impossible d\'ouvrir Powens',
      )
    } finally {
      setManaging(false)
    }
  }

  const displayError = actionError ?? error

  return (
    <div>
      <PageHeader
        eyebrow="Comptes"
        title="Comptes bancaires"
        description="Liste de vos comptes synchronisés via Powens."
        action={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={() => void reload()}
            >
              Actualiser
            </Button>
            <Button
              icon={<ExternalLink className="h-4 w-4" />}
              onClick={() => void handleManagePowens()}
              disabled={managing}
            >
              Gérer avec Powens
            </Button>
          </div>
        }
      />

      {loading ? (
        <LoadingState />
      ) : displayError ? (
        <ErrorState message={displayError} onRetry={() => void reload()} />
      ) : (
        <Card>
          {!accounts?.length ? (
            <EmptyState message="Aucun compte connecté. Utilisez Powens pour synchroniser vos comptes." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/5 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-3 font-medium">Plateforme</th>
                    <th className="px-3 py-3 font-medium">Compte</th>
                    <th className="px-3 py-3 font-medium">Solde</th>
                    <th className="px-3 py-3 font-medium">Devise</th>
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3 font-medium">IBAN</th>
                    <th className="px-3 py-3 font-medium">Mise à jour</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-white/5">
                      <td className="px-3 py-3 font-medium text-gray-200">
                        {account.bank_original_name}
                      </td>
                      <td className="px-3 py-3 text-gray-400">{account.original_name}</td>
                      <td
                        className={`px-3 py-3 font-medium ${
                          account.balance < 0 ? 'text-amber-400' : 'text-gray-100'
                        }`}
                      >
                        {formatCurrency(account.balance, account.currency || 'EUR')}
                      </td>
                      <td className="px-3 py-3 text-gray-500">{account.currency}</td>
                      <td className="px-3 py-3 text-gray-500">{account.type}</td>
                      <td className="px-3 py-3 font-mono text-xs text-gray-500">
                        {account.iban ? formatIban(account.iban) : '—'}
                      </td>
                      <td className="px-3 py-3 text-gray-500">
                        {formatDate(account.last_update)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
