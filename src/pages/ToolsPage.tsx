import { useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { NumberFormField } from '../components/ui/FormField'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { formatCurrency } from '../lib/format'

type ToolTab = 'simple' | 'compound' | 'loan'

export function ToolsPage() {
  const [tab, setTab] = useState<ToolTab>('simple')
  const [rate, setRate] = useState(3)
  const [duration, setDuration] = useState(10)
  const [capital, setCapital] = useState(10000)
  const [insuranceRate, setInsuranceRate] = useState(0.2)

  const simpleRows = useMemo(() => {
    return Array.from({ length: duration + 1 }, (_, year) => ({
      year,
      value: Math.round(capital + capital * (rate / 100) * year),
    }))
  }, [capital, duration, rate])

  const compoundRows = useMemo(() => {
    return Array.from({ length: duration + 1 }, (_, year) => {
      const value = Math.round(capital * (1 + rate / 100) ** year)
      const previous =
        year === 0 ? capital : Math.round(capital * (1 + rate / 100) ** (year - 1))
      return { year, value, profit: value - previous }
    })
  }, [capital, duration, rate])

  const loanResult = useMemo(() => {
    const monthlyRate = (rate + insuranceRate) / 100 / 12
    const months = duration * 12
    const mensuality =
      (capital * monthlyRate) / (1 - (1 + monthlyRate) ** -months)
    const totalPaid = mensuality * months
    const interests = totalPaid - capital
    return {
      mensuality,
      totalPaid,
      interests,
    }
  }, [capital, duration, insuranceRate, rate])

  const tabs: { id: ToolTab; label: string }[] = [
    { id: 'simple', label: 'Intérêts simples' },
    { id: 'compound', label: 'Intérêts composés' },
    { id: 'loan', label: 'Crédit amortissable' },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Outils"
        title="Calculateurs financiers"
        description="Simulez vos placements et crédits sans connexion au serveur."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === item.id
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card title="Paramètres">
          <div className="space-y-4">
            <NumberFormField
              label="Taux (%)"
              value={rate}
              onChange={setRate}
              min={0}
              max={20}
              step={0.1}
            />
            <NumberFormField
              label="Durée (années)"
              value={duration}
              onChange={setDuration}
              min={1}
              max={40}
              step={1}
            />
            <NumberFormField
              label="Capital (€)"
              value={capital}
              onChange={setCapital}
              min={100}
              max={1000000}
              step={100}
            />
            {tab === 'loan' && (
              <NumberFormField
                label="Assurance (%)"
                value={insuranceRate}
                onChange={setInsuranceRate}
                min={0}
                max={5}
                step={0.1}
              />
            )}
          </div>
        </Card>

        <Card title="Résultats">
          {tab === 'simple' && (
            <>
              <p className="mb-4 text-sm text-gray-500">
                Capital final :{' '}
                <span className="font-semibold text-brand-600">
                  {formatCurrency(simpleRows[simpleRows.length - 1]?.value ?? 0)}
                </span>
              </p>
              <ResultTable
                headers={['Année', 'Valeur']}
                rows={simpleRows.map((row) => [String(row.year), formatCurrency(row.value)])}
              />
            </>
          )}

          {tab === 'compound' && (
            <>
              <p className="mb-4 text-sm text-gray-500">
                Capital final :{' '}
                <span className="font-semibold text-brand-600">
                  {formatCurrency(compoundRows[compoundRows.length - 1]?.value ?? 0)}
                </span>
              </p>
              <ResultTable
                headers={['Année', 'Valeur', 'Gain']}
                rows={compoundRows.map((row) => [
                  String(row.year),
                  formatCurrency(row.value),
                  formatCurrency(row.profit),
                ])}
              />
            </>
          )}

          {tab === 'loan' && (
            <>
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <StatCard label="Mensualité" value={formatCurrency(loanResult.mensuality)} />
                <StatCard label="Intérêts" value={formatCurrency(loanResult.interests)} />
                <StatCard label="Total remboursé" value={formatCurrency(loanResult.totalPaid)} />
              </div>
              <p className="text-sm text-gray-500">
                Simulation basée sur un crédit amortissable classique.
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

function ResultTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: string[][]
}) {
  return (
    <div className="max-h-96 overflow-auto rounded-xl border border-white/5">
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 bg-surface-hover text-xs uppercase tracking-wide text-gray-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2 text-gray-400">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
