import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { GlobeOff, Globe, Clock } from 'lucide-react'

export function LeadOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
    refetchInterval: 30000,
  })

  if (isLoading) {
    return <div className="glass-card p-5"><div className="skeleton h-40" /></div>
  }

  const total = (stats?.without_website ?? 0) + (stats?.with_website ?? 0) + (stats?.pending_verification ?? 0)
  const noWebsitePct = total > 0 ? ((stats?.without_website ?? 0) / total) * 100 : 0
  const hasWebsitePct = total > 0 ? ((stats?.with_website ?? 0) / total) * 100 : 0
  const pendingPct = total > 0 ? ((stats?.pending_verification ?? 0) / total) * 100 : 0

  return (
    <div className="glass-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">Lead Breakdown</h3>

      {total === 0 ? (
        <p className="py-6 text-center text-sm text-text-muted">No data yet</p>
      ) : (
        <>
          <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-bg-primary">
            <div
              className="bg-success transition-all duration-500"
              style={{ width: `${noWebsitePct}%` }}
            />
            <div
              className="bg-text-muted transition-all duration-500"
              style={{ width: `${hasWebsitePct}%` }}
            />
            <div
              className="bg-warning transition-all duration-500"
              style={{ width: `${pendingPct}%` }}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GlobeOff className="h-3.5 w-3.5 text-success" />
                <span className="text-xs text-text-secondary">No Website (Leads)</span>
              </div>
              <span className="font-mono text-sm font-semibold text-success">
                {stats?.without_website ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-text-muted" />
                <span className="text-xs text-text-secondary">Has Website</span>
              </div>
              <span className="font-mono text-sm font-semibold text-text-muted">
                {stats?.with_website ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-warning" />
                <span className="text-xs text-text-secondary">Pending Verification</span>
              </div>
              <span className="font-mono text-sm font-semibold text-warning">
                {stats?.pending_verification ?? 0}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
