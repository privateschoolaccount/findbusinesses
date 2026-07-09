import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Link } from 'react-router-dom'
import { formatDateTime } from '@/lib/utils'
import { SearchStatusBadge } from './SearchStatusBadge'
import { ChevronRight } from 'lucide-react'

interface SearchListProps {
  status?: string
}

export function SearchList({ status }: SearchListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['searches', { page: 1, limit: 20, status }],
    queryFn: () => api.listSearches({ page: 1, limit: 20, status }),
    refetchInterval: 5000,
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-16" />
        ))}
      </div>
    )
  }

  if (!data?.rows?.length) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-sm text-text-muted">No searches found</p>
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Query</th>
            <th>Location</th>
            <th>Status</th>
            <th>Results</th>
            <th>No Website</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((search) => (
            <tr key={search.id}>
              <td className="font-medium text-text-primary">{search.query}</td>
              <td className="text-text-secondary">{search.location}</td>
              <td><SearchStatusBadge status={search.status} /></td>
              <td className="font-mono text-text-secondary">{search.total_found}</td>
              <td className="font-mono font-semibold text-success">{search.without_website}</td>
              <td className="text-text-muted text-xs">{formatDateTime(search.created_at)}</td>
              <td>
                <Link
                  to={`/searches/${search.id}`}
                  className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
                >
                  View <ChevronRight className="h-3 w-3" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
