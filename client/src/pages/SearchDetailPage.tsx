import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useParams, Link } from 'react-router-dom'
import { formatDateTime } from '@/lib/utils'
import { SearchStatusBadge } from '@/components/searches/SearchStatusBadge'
import { ResultTable } from '@/components/results/ResultTable'
import { AddToCollectionDialog } from '@/components/results/AddToCollectionDialog'
import { ResultsMap } from '@/components/map/ResultsMap'
import { ArrowLeft, RefreshCw, FolderPlus } from 'lucide-react'

export function SearchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)

  const { data: search, isLoading } = useQuery({
    queryKey: ['search', id],
    queryFn: () => api.getSearch(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'processing' || status === 'pending' ? 3000 : false
    },
  })

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ['searchResults', id, statusFilter],
    queryFn: () => api.getSearchResults(id!, { page: 1, limit: 100, status: statusFilter }),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = search?.status
      return status === 'processing' || status === 'pending' ? 3000 : false
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-40" />
        <div className="skeleton h-64" />
      </div>
    )
  }

  if (!search) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-text-muted">Search not found</p>
        <Link to="/searches" className="mt-4 inline-block text-sm text-accent hover:text-accent-hover">
          Back to searches
        </Link>
      </div>
    )
  }

  const isProcessing = search.status === 'processing' || search.status === 'pending'
  const resultRows = results?.rows ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/searches" className="text-text-muted hover:text-text-secondary transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-text-primary sm:text-xl">
              {search.query} <span className="text-text-muted font-normal">in</span> {search.location}
            </h1>
            <p className="mt-0.5 text-xs text-text-muted">{formatDateTime(search.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isProcessing && (
            <span className="flex items-center gap-1.5 text-xs text-accent">
              <RefreshCw className="h-3 w-3 animate-spin" /> Updating...
            </span>
          )}
          <SearchStatusBadge status={search.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="stat-card text-center">
          <div className="font-mono text-2xl font-bold text-text-primary">{search.total_found}</div>
          <div className="text-xs text-text-muted mt-1">Total Found</div>
        </div>
        <div className="stat-card text-center">
          <div className="font-mono text-2xl font-bold text-success">{search.without_website}</div>
          <div className="text-xs text-text-muted mt-1">No Website</div>
        </div>
        <div className="stat-card text-center">
          <div className="font-mono text-2xl font-bold text-text-muted">{search.with_website}</div>
          <div className="text-xs text-text-muted mt-1">Has Website</div>
        </div>
        <div className="stat-card text-center">
          <div className="font-mono text-2xl font-bold text-warning">{search.pending_verification}</div>
          <div className="text-xs text-text-muted mt-1">Pending</div>
        </div>
      </div>

      {search.error && (
        <div className="glass-card border-error/30 p-4">
          <p className="text-sm text-error">{search.error}</p>
        </div>
      )}

      {resultRows.length > 0 && <ResultsMap results={resultRows} />}

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-text-primary">Results</h2>
          <div className="flex flex-wrap gap-1">
            {[
              { value: undefined, label: 'All' },
              { value: 'no_website', label: 'No Website' },
              { value: 'has_website', label: 'Has Website' },
              { value: 'pending_verification', label: 'Pending' },
            ].map((f) => (
              <button
                key={f.label}
                onClick={() => {
                  setStatusFilter(f.value)
                  setSelectedIds([])
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === f.value
                    ? 'bg-accent-dim text-accent'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-card'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="glass-card mb-3 flex flex-wrap items-center gap-3 p-3">
            <span className="text-sm text-text-secondary">{selectedIds.length} selected</span>
            <button
              onClick={() => setShowAddDialog(true)}
              className="btn-primary flex items-center gap-1.5 text-xs py-1.5"
            >
              <FolderPlus className="h-3.5 w-3.5" /> Add to Collection
            </button>
            <button onClick={() => setSelectedIds([])} className="btn-ghost text-xs py-1.5">
              Clear
            </button>
          </div>
        )}

        <ResultTable
          results={resultRows}
          isLoading={resultsLoading}
          showSearchColumn={false}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>

      {showAddDialog && (
        <AddToCollectionDialog
          resultIds={selectedIds}
          onClose={() => {
            setShowAddDialog(false)
            setSelectedIds([])
          }}
        />
      )}
    </div>
  )
}
