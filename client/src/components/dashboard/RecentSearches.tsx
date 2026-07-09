import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Link } from 'react-router-dom'
import { timeAgo } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'
import { SearchStatusBadge } from '@/components/searches/SearchStatusBadge'

export function RecentSearches() {
  const { data, isLoading } = useQuery({
    queryKey: ['searches', { page: 1, limit: 5 }],
    queryFn: () => api.listSearches({ page: 1, limit: 5 }),
    refetchInterval: 10000,
  })

  if (isLoading) {
    return (
      <div className="glass-card p-5">
        <div className="skeleton mb-4 h-5 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-12" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Recent Searches</h3>
        <Link
          to="/searches"
          className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {!data?.rows?.length ? (
        <p className="py-6 text-center text-sm text-text-muted">No searches yet</p>
      ) : (
        <div className="space-y-2">
          {data.rows.map((search) => (
            <Link
              key={search.id}
              to={`/searches/${search.id}`}
              className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-border-hover hover:bg-bg-card-hover transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-text-primary">
                    {search.query}
                  </span>
                  <span className="text-xs text-text-muted">in</span>
                  <span className="truncate text-xs text-text-secondary">{search.location}</span>
                </div>
                <span className="text-xs text-text-muted">{timeAgo(search.created_at)}</span>
              </div>
              <SearchStatusBadge status={search.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
