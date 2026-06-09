interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <p className="rounded-xl border border-dashed border-white/10 bg-surface-hover px-4 py-10 text-center text-sm text-gray-500">
      {message}
    </p>
  )
}
