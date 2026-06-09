import type { CashflowSummary as CashflowSummaryData } from '../../lib/expenseStats'
import { formatCurrency } from '../../lib/format'

interface CashflowSummaryProps {
  summary: CashflowSummaryData
}

export function CashflowSummary({ summary }: CashflowSummaryProps) {
  return (
    <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
      <div className="rounded-xl bg-emerald-500/10 px-3 py-3 sm:px-4">
        <p className="text-xs text-gray-500">Entrées</p>
        <p className="mt-1 text-base font-semibold text-emerald-400 sm:text-lg">
          {formatCurrency(summary.income)}
        </p>
      </div>
      <div className="rounded-xl bg-red-500/10 px-3 py-3 sm:px-4">
        <p className="text-xs text-gray-500">Sorties</p>
        <p className="mt-1 text-base font-semibold text-red-400 sm:text-lg">
          {formatCurrency(summary.expenses)}
        </p>
      </div>
      <div className="rounded-xl bg-white/5 px-3 py-3 sm:px-4">
        <p className="text-xs text-gray-500">Disponible</p>
        <p
          className={`mt-1 text-base font-semibold sm:text-lg ${
            summary.available >= 0 ? 'text-white' : 'text-amber-400'
          }`}
        >
          {formatCurrency(summary.available)}
        </p>
      </div>
    </div>
  )
}
