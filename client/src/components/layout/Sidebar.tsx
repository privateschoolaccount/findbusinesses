import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  Briefcase,
  FolderOpen,
  Zap,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/searches', icon: Search, label: 'Searches' },
  { to: '/results', icon: Briefcase, label: 'Results' },
  { to: '/collections', icon: FolderOpen, label: 'Collections' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-bg-secondary transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            <span className="text-sm font-bold tracking-tight text-text-primary">
              FindBusinesses
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-text-muted hover:text-text-primary lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent-dim text-accent'
                    : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <div className="text-xs text-text-muted">
            Lead generation tool
          </div>
        </div>
      </aside>
    </>
  )
}
