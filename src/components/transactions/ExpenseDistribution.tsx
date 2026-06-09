import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { ExpenseSlice } from '../../lib/expenseStats'
import {
  getExpenseCategoryColor,
  type ExpenseCategoryId,
} from '../../lib/expenseCategories'
import { formatCurrency } from '../../lib/format'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'

interface ExpenseDistributionProps {
  slices: ExpenseSlice[]
  total: number
  selectedCategory: ExpenseCategoryId | null
  onSelectCategory: (category: ExpenseCategoryId) => void
}

export function ExpenseDistribution({
  slices,
  total,
  selectedCategory,
  onSelectCategory,
}: ExpenseDistributionProps) {
  return (
    <Card title="Distribution">
      {slices.length === 0 ? (
        <EmptyState message="Aucune dépense catégorisée pour ce mois." />
      ) : (
        <div className="space-y-5">
          <div className="relative mx-auto h-56 w-full max-w-[240px] expense-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="amount"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={2}
                  activeShape={false}
                  style={{ cursor: 'pointer' }}
                  onClick={(_, index) => {
                    const category = slices[index]?.category
                    if (category) onSelectCategory(category)
                  }}
                >
                  {slices.map((slice) => (
                    <Cell
                      key={slice.category}
                      fill={getExpenseCategoryColor(slice.category)}
                      stroke={
                        selectedCategory === slice.category
                          ? '#38bdf8'
                          : 'transparent'
                      }
                      strokeWidth={selectedCategory === slice.category ? 2 : 0}
                      opacity={
                        selectedCategory && selectedCategory !== slice.category
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
                  contentStyle={{
                    background: '#1a1f2b',
                    border: '1px solid #2a3544',
                    borderRadius: '12px',
                    fontSize: '13px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-500">Somme sorties</span>
              <span className="mt-0.5 text-lg font-semibold tracking-tight text-white">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            {slices.map((slice) => (
              <button
                key={slice.category}
                type="button"
                onClick={() => onSelectCategory(slice.category)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  selectedCategory === slice.category
                    ? 'bg-brand-50 ring-1 ring-brand-500/30'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: getExpenseCategoryColor(slice.category),
                    }}
                  />
                  <span className="truncate font-medium text-gray-300">
                    {slice.label}
                  </span>
                </div>
                <span className="ml-2 shrink-0 text-gray-500">
                  {formatCurrency(slice.amount)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
