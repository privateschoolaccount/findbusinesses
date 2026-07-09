import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ExternalLink, MapPin, Phone, Star } from 'lucide-react'
import type { ResultResponse } from '@/types'

const statusConfig: Record<string, { label: string; className: string }> = {
  no_website: { label: 'No Website', className: 'badge-success' },
  has_website: { label: 'Has Website', className: 'badge-accent' },
  pending_verification: { label: 'Pending', className: 'badge-warning' },
}

interface ResultTableProps {
  results: ResultResponse[]
  isLoading?: boolean
  showSearchColumn?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}

export function ResultTable({
  results,
  isLoading,
  showSearchColumn = true,
  selectedIds = [],
  onSelectionChange,
}: ResultTableProps) {
  const selectable = !!onSelectionChange

  const toggleAll = () => {
    if (!onSelectionChange) return
    if (selectedIds.length === results.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(results.map((r) => r.id))
    }
  }

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  if (isLoading) {
    return (
      <div className="glass-card space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-14" />
        ))}
      </div>
    )
  }

  if (!results.length) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-sm text-text-muted">No results found</p>
      </div>
    )
  }

  const allSelected = results.length > 0 && selectedIds.length === results.length
  const someSelected = selectedIds.length > 0 && !allSelected

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            {selectable && (
              <th className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected }}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 rounded border-border bg-bg-input accent-accent"
                />
              </th>
            )}
            <th>Business</th>
            <th>Address</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Rating</th>
            {showSearchColumn && <th>Search</th>}
          </tr>
        </thead>
        <tbody>
          {results.map((result) => {
            const isSelected = selectedIds.includes(result.id)
            return (
              <tr
                key={result.id}
                className={cn(selectable && 'cursor-pointer', isSelected && 'bg-accent-dim/30')}
                onClick={() => selectable && toggleOne(result.id)}
              >
                {selectable && (
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(result.id)}
                      className="h-3.5 w-3.5 rounded border-border bg-bg-input accent-accent"
                    />
                  </td>
                )}
                <td>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">{result.name}</span>
                    {result.website && (
                      <a
                        href={result.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-muted hover:text-accent transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {result.network_site && !result.website && (
                      <a
                        href={result.network_site}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-muted hover:text-accent transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {result.categories && result.categories.length > 0 && (
                    <div className="mt-0.5 flex gap-1">
                      {result.categories.slice(0, 2).map((cat) => (
                        <span key={cat} className="text-xs text-text-muted">{cat}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td>
                  {result.address ? (
                    <span className="flex items-center gap-1 text-text-secondary">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{result.address}</span>
                    </span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
                <td>
                  {result.phone ? (
                    <span className="flex items-center gap-1 text-text-secondary">
                      <Phone className="h-3 w-3" />
                      {result.phone}
                    </span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
                <td>
                  <span className={cn('badge', statusConfig[result.status]?.className ?? 'badge-accent')}>
                    {statusConfig[result.status]?.label ?? result.status}
                  </span>
                </td>
                <td>
                  {result.rating ? (
                    <span className="flex items-center gap-1 font-mono text-sm text-text-secondary">
                      <Star className="h-3 w-3 text-warning fill-warning" />
                      {result.rating.toFixed(1)}
                      {result.total_ratings && (
                        <span className="text-text-muted text-xs">({result.total_ratings})</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
                {showSearchColumn && (
                  <td>
                    <Link
                      to={`/searches/${result.search_id}`}
                      className="text-xs text-accent hover:text-accent-hover transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View search
                    </Link>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </div>
  )
}
