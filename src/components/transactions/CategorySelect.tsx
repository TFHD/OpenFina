import {
  getExpenseCategoryOptions,
  type ExpenseCategoryId,
} from '../../lib/expenseCategories'

interface CategorySelectProps {
  value: ExpenseCategoryId | ''
  onChange: (category: ExpenseCategoryId) => void
  disabled?: boolean
}

export function CategorySelect({
  value,
  onChange,
  disabled = false,
}: CategorySelectProps) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as ExpenseCategoryId)}
      className="max-w-[11rem] rounded-xl border border-white/10 bg-surface-hover px-2 py-1.5 text-sm text-gray-300 outline-none ring-brand-500 focus:ring-2 disabled:cursor-wait disabled:opacity-60"
      aria-label="Catégorie de la dépense"
    >
      <option value="" disabled>
        Choisir…
      </option>
      {getExpenseCategoryOptions().map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
