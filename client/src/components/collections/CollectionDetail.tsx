import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useParams, Link } from 'react-router-dom'
import { ResultTable } from '@/components/results/ResultTable'
import { ArrowLeft, MapPin, Tag } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export function CollectionDetail() {
  const { id } = useParams<{ id: string }>()
  const collectionId = Number(id)

  const { data: collection, isLoading: collectionLoading } = useQuery({
    queryKey: ['collection', collectionId],
    queryFn: () => api.getCollection(collectionId),
    enabled: !isNaN(collectionId),
  })

  const { data: businesses, isLoading: businessesLoading } = useQuery({
    queryKey: ['collectionBusinesses', collectionId],
    queryFn: () => api.getCollectionBusinesses(collectionId, { page: 1, limit: 100 }),
    enabled: !isNaN(collectionId),
  })

  if (collectionLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-40" />
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-text-muted">Collection not found</p>
        <Link to="/collections" className="mt-4 inline-block text-sm text-accent hover:text-accent-hover">
          Back to collections
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/collections" className="text-text-muted hover:text-text-secondary transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-text-primary sm:text-xl">{collection.name}</h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-text-muted sm:gap-3">
            {collection.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {collection.location}
              </span>
            )}
            <span>Created {formatDateTime(collection.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="stat-card text-center">
          <div className="font-mono text-xl font-bold text-text-primary sm:text-2xl">{collection.totalLeads}</div>
          <div className="text-xs text-text-muted mt-1">Total Leads</div>
        </div>
        <div className="stat-card text-center">
          <div className="font-mono text-xl font-bold text-success sm:text-2xl">{collection.noWebsite}</div>
          <div className="text-xs text-text-muted mt-1">No Website</div>
        </div>
        <div className="stat-card text-center">
          <div className="font-mono text-xl font-bold text-accent sm:text-2xl">{collection.newLeads}</div>
          <div className="text-xs text-text-muted mt-1">New (7d)</div>
        </div>
      </div>

      {collection.tags && collection.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {collection.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-md bg-bg-card px-2.5 py-1 text-xs text-text-secondary border border-border"
            >
              <Tag className="h-3 w-3" /> {tag}
            </span>
          ))}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Businesses in this Collection</h2>
        <ResultTable
          results={businesses?.rows ?? []}
          isLoading={businessesLoading}
          showSearchColumn={true}
        />
      </div>
    </div>
  )
}
