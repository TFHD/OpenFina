import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  action?: ReactNode
  children: ReactNode
}

export function Card({ title, action, children }: CardProps) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
