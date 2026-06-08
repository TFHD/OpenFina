import { NavLink } from 'react-router-dom'
import {
  Building2,
  Calculator,
  CreditCard,
  LayoutDashboard,
  LineChart,
  Wallet,
  X,
} from 'lucide-react'

const links = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/investments', label: 'Investissements', icon: LineChart },
  { to: '/accounts', label: 'Comptes', icon: Building2 },
  { to: '/transactions', label: 'Transactions', icon: CreditCard },
  { to: '/loans', label: 'Crédits', icon: Wallet },
  { to: '/tools', label: 'Outils', icon: Calculator },
]

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-brand-700 px-4 py-6 text-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="mb-8 flex items-center justify-between gap-3 px-2 lg:mb-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-bold">
            F
          </div>
          <div>
            <p className="text-lg font-semibold">OpenFina</p>
            <p className="text-xs text-brand-100">Suivi financier</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-brand-100 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-brand-100 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <p className="px-2 text-xs text-brand-200">Agrégation Powens</p>
    </aside>
  )
}
