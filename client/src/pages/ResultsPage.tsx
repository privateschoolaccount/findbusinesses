import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { ResultTable } from '@/components/results/ResultTable'
import { AddToCollectionDialog } from '@/components/results/AddToCollectionDialog'
import { FolderPlus } from 'lucide-react'

export function ResultsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Results</h1>
        <p className="mt-1 text-sm text-text-muted">Browse all business results across searches</p>
      </div>
      <ResultsList />
    </div>
  )
}

function ResultsList() {
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)

  const { data: searchData } = useQuery({
    queryKey: ['searchesForResults'],
    queryFn: () => api.listSearches({ page: 1, limit: 100, status: 'completed' }),
  })

  const searchIds = searchData?.rows?.map((s) => s.id) ?? []
  const latestSearchId = searchIds[0]

  const { data: results, isLoading } = useQuery({
    queryKey: ['allResults', latestSearchId, page],
    queryFn: () => latestSearchId
      ? api.getSearchResults(latestSearchId, { page, limit: 50 })
      : Promise.resolve({ rows: [], total: 0, page: 1, limit: 50 }),
    enabled: !!latestSearchId,
  })

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <div className="glass-card flex flex-wrap items-center gap-3 p-3">
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
        results={results?.rows ?? []}
        isLoading={isLoading}
        showSearchColumn={false}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {results && results.total > 50 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">
            Showing {results.rows.length} of {results.total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost text-xs"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={results.rows.length < 50}
              className="btn-ghost text-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}

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
