import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { X, FolderOpen, Check } from 'lucide-react'

interface AddToCollectionDialogProps {
  resultIds: string[]
  onClose: () => void
}

export function AddToCollectionDialog({ resultIds, onClose }: AddToCollectionDialogProps) {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data: collections, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: api.listCollections,
  })

  const mutation = useMutation({
    mutationFn: (collectionId: number) => api.addBusinessesToCollection(collectionId, resultIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-card mx-4 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-base font-semibold text-text-primary">Add to Collection</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="mb-4 text-sm text-text-secondary">
            Select a collection to add {resultIds.length} {resultIds.length === 1 ? 'business' : 'businesses'} to.
          </p>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-12" />
              ))}
            </div>
          ) : !collections?.length ? (
            <p className="py-4 text-center text-sm text-text-muted">
              No collections yet. Create one first.
            </p>
          ) : (
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => setSelectedId(col.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    selectedId === col.id
                      ? 'border-accent bg-accent-dim'
                      : 'border-border hover:border-border-hover hover:bg-bg-card-hover'
                  }`}
                >
                  <FolderOpen className="h-4 w-4 flex-shrink-0 text-text-muted" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text-primary">{col.name}</div>
                    <div className="text-xs text-text-muted">{col.totalLeads} leads</div>
                  </div>
                  {selectedId === col.id && <Check className="h-4 w-4 text-accent" />}
                </button>
              ))}
            </div>
          )}

          {mutation.isError && (
            <p className="mt-3 text-xs text-error">{mutation.error.message}</p>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} className="btn-ghost">Cancel</button>
            <button
              onClick={() => selectedId && mutation.mutate(selectedId)}
              disabled={!selectedId || mutation.isPending}
              className="btn-primary"
            >
              {mutation.isPending ? 'Adding...' : 'Add to Collection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
