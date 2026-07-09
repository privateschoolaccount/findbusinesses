import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Search, Briefcase, Globe, GlobeOff, Clock, CheckCircle } from 'lucide-react'

const statConfig = [
  { key: 'total_searches' as const, label: 'Total Searches', icon: Search, color: 'text-accent', bg: 'bg-accent-dim' },
  { key: 'total_results' as const, label: 'Total Results', icon: Briefcase, color: 'text-accent', bg: 'bg-accent-dim' },
  { key: 'without_website' as const, label: 'No Website', icon: GlobeOff, color: 'text-success', bg: 'bg-success-dim' },
  { key: 'with_website' as const, label: 'Has Website', icon: Globe, color: 'text-text-muted', bg: 'bg-bg-card' },
  { key: 'pending_verification' as const, label: 'Pending', icon: Clock, color: 'text-warning', bg: 'bg-warning-dim' },
  { key: 'verified_count' as const, label: 'Verified', icon: CheckCircle, color: 'text-success', bg: 'bg-success-dim' },
]

export function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {statConfig.map(({ key, label, icon: Icon, color, bg }) => (
        <div key={key} className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {stats?.[key] ?? 0}
            </span>
            <div className={`rounded-lg p-2 ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
          </div>
          <p className="mt-2 text-xs font-medium text-text-muted">{label}</p>
        </div>
      ))}
    </div>
  )
}
