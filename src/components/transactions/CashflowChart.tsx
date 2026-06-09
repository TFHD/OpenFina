import { useMemo } from 'react'
import type { ExpenseSlice } from '../../lib/expenseStats'
import { getExpenseCategoryColor } from '../../lib/expenseCategories'
import { formatCurrency } from '../../lib/format'
import {
  layoutCashflowSankey,
  type ColoredExpenseSlice,
} from '../../lib/cashflowSankey'

interface CashflowChartProps {
  income: number
  expenses: ExpenseSlice[]
}

export function CashflowChart({ income, expenses }: CashflowChartProps) {
  const coloredExpenses: ColoredExpenseSlice[] = useMemo(
    () =>
      expenses.map((slice) => ({
        ...slice,
        color: getExpenseCategoryColor(slice.category),
      })),
    [expenses],
  )

  const layout = useMemo(
    () => layoutCashflowSankey(income, coloredExpenses),
    [income, coloredExpenses],
  )

  if (layout.nodes.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-gray-500">
        Aucune donnée de flux pour ce mois.
      </p>
    )
  }

  const source = layout.nodes[0]
  const targets = layout.nodes.slice(1)

  return (
    <div
      className="relative w-full"
      style={{ height: layout.height }}
    >
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Flux revenus vers dépenses par catégorie"
      >
        {layout.links.map((link, index) => (
          <path
            key={index}
            d={link.path}
            fill={link.color}
            fillOpacity={0.21}
            stroke="none"
          />
        ))}

        <rect
          x={source.x}
          y={source.y}
          width={source.width}
          height={source.height}
          rx={3}
          fill={source.color}
          fillOpacity={0.9}
        />

        {targets.map((node) => (
          <rect
            key={node.id}
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            rx={3}
            fill={node.color}
            fillOpacity={0.9}
          />
        ))}
      </svg>

      <div
        className="pointer-events-none absolute flex items-center gap-2"
        style={{
          left: `${((source.x + source.width + 10) / layout.width) * 100}%`,
          top: `${(source.y / layout.height) * 100}%`,
          height: `${(source.height / layout.height) * 100}%`,
        }}
      >
        <span className="text-xs font-medium text-gray-300">{source.label}</span>
        <span className="text-xs text-gray-500">
          {formatCurrency(source.value)}
        </span>
      </div>

      {targets.map((node) => (
        <div
          key={node.id}
          className="pointer-events-none absolute flex items-center gap-2"
          style={{
            left: `${((node.x + node.width + 10) / layout.width) * 100}%`,
            top: `${(node.y / layout.height) * 100}%`,
            height: `${(node.height / layout.height) * 100}%`,
          }}
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: node.color }}
          />
          <span className="truncate text-xs font-medium text-gray-300">
            {node.label}
          </span>
          <span className="shrink-0 text-xs text-gray-500">
            {formatCurrency(node.value)}
          </span>
        </div>
      ))}
    </div>
  )
}
