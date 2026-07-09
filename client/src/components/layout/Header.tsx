import { ChevronRight, Menu } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/searches': 'Searches',
  '/results': 'Results',
  '/collections': 'Collections',
}

interface HeaderProps {
  onMenuToggle?: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  const crumbs = [{ path: '/', label: 'Dashboard' }]

  if (segments.length > 0) {
    let path = ''
    for (const seg of segments) {
      path += `/${seg}`
      crumbs.push({ path, label: routeLabels[path] || seg.charAt(0).toUpperCase() + seg.slice(1) })
    }
  }

  return (
    <header className="flex h-16 items-center border-b border-border bg-bg-secondary px-4 sm:px-6">
      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          className="mr-3 rounded-md p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-card lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
      <nav className="flex items-center gap-1.5 text-sm overflow-x-auto">
        {crumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-1.5 whitespace-nowrap">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-text-muted" />}
            {i === crumbs.length - 1 ? (
              <span className="font-medium text-text-primary">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="text-text-muted hover:text-text-secondary transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </header>
  )
}
