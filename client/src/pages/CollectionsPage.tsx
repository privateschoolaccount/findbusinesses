import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { CollectionCard } from '@/components/collections/CollectionCard'
import { CreateCollectionDialog } from '@/components/collections/CreateCollectionDialog'
import { Plus } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { CollectionDetail } from '@/components/collections/CollectionDetail'

export function CollectionsPage() {
  const { id } = useParams<{ id: string }>()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const queryClient = useQueryClient()

  const { data: collections, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: api.listCollections,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })

  // If we have an ID param, show detail view
  if (id) {
    return <CollectionDetail />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Collections</h1>
          <p className="mt-1 text-sm text-text-muted">Organize your leads into groups</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" /> New Collection
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-48" />
          ))}
        </div>
      ) : !collections?.length ? (
        <div className="glass-card p-12 text-center">
          <p className="text-sm text-text-muted">No collections yet</p>
          <p className="mt-1 text-xs text-text-muted">Create one to organize your leads</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <CollectionCard
              key={col.id}
              collection={col}
              onDelete={(id) => {
                if (confirm('Delete this collection? This cannot be undone.')) {
                  deleteMutation.mutate(id)
                }
              }}
            />
          ))}
        </div>
      )}

      {showCreateDialog && (
        <CreateCollectionDialog onClose={() => setShowCreateDialog(false)} />
      )}
    </div>
  )
}
