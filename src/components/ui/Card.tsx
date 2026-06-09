import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function Card({ title, action, children, className = '' }: CardProps) {
  return (
    <section className={`rounded-2xl bg-surface-raised p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          {title && (
            <h2 className="text-base font-medium text-gray-200">{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
