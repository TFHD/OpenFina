import type { ReactNode } from 'react'

const inputClass =
  'w-full rounded-xl border border-white/10 bg-surface-hover px-3 py-2.5 text-sm text-gray-100 outline-none ring-brand-500 focus:ring-2'

function FormFieldShell({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-400">{label}</span>
      {children}
    </label>
  )
}

export function TextFormField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options?: { value: string; label: string }[]
}) {
  return (
    <FormFieldShell label={label}>
      {options ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )}
    </FormFieldShell>
  )
}

export function NumberFormField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
}) {
  return (
    <FormFieldShell label={label}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className={inputClass}
      />
    </FormFieldShell>
  )
}
