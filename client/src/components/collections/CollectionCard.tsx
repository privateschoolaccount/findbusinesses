import { Link } from 'react-router-dom'
import { formatDateTime, timeAgo } from '@/lib/utils'
import { FolderOpen, MapPin, Tag, Trash2 } from 'lucide-react'
import type { CollectionResponse } from '@/types'

interface CollectionCardProps {
  collection: CollectionResponse
  onDelete?: (id: number) => void
}

export function CollectionCard({ collection, onDelete }: CollectionCardProps) {
  return (
    <Link
      to={`/collections/${collection.id}`}
      className="glass-card group block p-5 transition-all hover:border-border-hover hover:bg-bg-card-hover"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent-dim p-2">
            <FolderOpen className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
              {collection.name}
            </h3>
            {collection.location && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 text-text-muted" />
                <span className="text-xs text-text-muted">{collection.location}</span>
              </div>
            )}
          </div>
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete(collection.id)
            }}
            className="rounded-md p-1.5 text-text-muted opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error-dim transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <div className="font-mono text-lg font-bold text-text-primary">{collection.totalLeads}</div>
          <div className="text-xs text-text-muted">Total Leads</div>
        </div>
        <div>
          <div className="font-mono text-lg font-bold text-success">{collection.noWebsite}</div>
          <div className="text-xs text-text-muted">No Website</div>
        </div>
        <div>
          <div className="font-mono text-lg font-bold text-accent">{collection.newLeads}</div>
          <div className="text-xs text-text-muted">New (7d)</div>
        </div>
      </div>

      {collection.tags && collection.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {collection.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-md bg-bg-primary px-2 py-0.5 text-xs text-text-muted"
            >
              <Tag className="h-2.5 w-2.5" /> {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 text-xs text-text-muted">
        Updated {timeAgo(collection.updated_at)}
      </div>
    </Link>
  )
}
