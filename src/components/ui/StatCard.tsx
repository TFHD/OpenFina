interface StatCardProps {
  label: string
  value: string
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="px-2 py-3 text-center">
      <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1.5 text-sm text-gray-500">{label}</p>
    </div>
  )
}
