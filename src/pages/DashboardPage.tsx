import { useCallback, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { RefreshCw } from 'lucide-react'
import {
  getBankAccountSums,
  getHistory,
} from '../api/services'
import type { BankAccountSum, HistoryPeriod, HistoryValuePoint } from '../api/types'
import { STOCKS_TYPES } from '../api/types'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { useAsyncLoad } from '../hooks/useAsyncLoad'
import { formatCurrency, formatDate } from '../lib/format'

const periods: { value: HistoryPeriod; label: string }[] = [
  { value: 'month', label: 'Mois' },
  { value: 'year', label: 'Année' },
  { value: 'all', label: 'Tout' },
]

function toChartData(
  stocks: HistoryValuePoint[] | undefined,
  checking: HistoryValuePoint[] | undefined,
  savings: HistoryValuePoint[] | undefined,
) {
  const stockPoints = stocks ?? []
  const checkingPoints = checking ?? []
  const savingsPoints = savings ?? []

  const dates = new Set<string>()
  for (const point of [...stockPoints, ...checkingPoints, ...savingsPoints]) {
    dates.add(point.DateValuation)
  }

  const sortedDates = [...dates].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  )

  const mapSeries = (data: HistoryValuePoint[]) =>
    Object.fromEntries(data.map((p) => [p.DateValuation, p.Valuation]))

  const stocksMap = mapSeries(stockPoints)
  const checkingMap = mapSeries(checkingPoints)
  const savingsMap = mapSeries(savingsPoints)

  return sortedDates.map((date) => ({
    date: formatDate(date),
    stocks: stocksMap[date] ?? 0,
    checking: checkingMap[date] ?? 0,
    savings: savingsMap[date] ?? 0,
  }))
}

interface DashboardData {
  sums: BankAccountSum[]
  chartData: ReturnType<typeof toChartData>
}

export function DashboardPage() {
  const [period, setPeriod] = useState<HistoryPeriod>('all')

  const fetchDashboard = useCallback(async (): Promise<DashboardData> => {
    const [sumsData, stocks, checking, savings] = await Promise.all([
      getBankAccountSums(),
      getHistory(period, STOCKS_TYPES),
      getHistory(period, 'checking'),
      getHistory(period, 'savings'),
    ])

    return {
      sums: sumsData,
      chartData: toChartData(stocks, checking, savings),
    }
  }, [period])

  const { data, loading, setLoading, error, reload } = useAsyncLoad(
    fetchDashboard,
    'Impossible de charger les données',
  )

  const selectPeriod = (value: HistoryPeriod) => {
    setPeriod(value)
    setLoading(true)
  }

  const sums = data?.sums ?? []
  const chartData = data?.chartData ?? []

  const total = useMemo(
    () => sums.reduce((acc, item) => acc + item.value, 0),
    [sums],
  )

  return (
    <div>
      <PageHeader
        eyebrow="Espace client"
        title="Tableau de bord"
        description="Vue d'ensemble de vos actifs financiers."
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total" value={formatCurrency(total)} />
              {sums.map((item) => (
                <StatCard
                  key={item.type}
                  label={item.type}
                  value={formatCurrency(item.value)}
                />
              ))}
            </div>
          </Card>

          <Card
            title="Évolution"
            action={
              <div className="flex gap-2">
                {periods.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => selectPeriod(p.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      period === p.value
                        ? 'bg-white/10 text-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            }
          >
            {chartData.length === 0 ? (
              <EmptyState message="Aucune donnée historique disponible pour le moment." />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        background: '#1a1f2b',
                        border: '1px solid #2a3544',
                        borderRadius: '12px',
                        fontSize: '13px',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="stocks"
                      stackId="1"
                      stroke="#38bdf8"
                      fill="#38bdf8"
                      fillOpacity={0.15}
                      name="Actions & fonds"
                    />
                    <Area
                      type="monotone"
                      dataKey="checking"
                      stackId="1"
                      stroke="#0ea5e9"
                      fill="#0ea5e9"
                      fillOpacity={0.12}
                      name="Comptes bancaires"
                    />
                    <Area
                      type="monotone"
                      dataKey="savings"
                      stackId="1"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.1}
                      name="Livrets"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
