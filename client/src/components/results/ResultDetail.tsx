import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { ResultResponse } from '@/types'
import { X, ExternalLink, MapPin, Phone, Star, CheckCircle, GlobeOff, Globe, StickyNote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface ResultDetailProps {
  result: ResultResponse
  onClose: () => void
}

export function ResultDetail({ result, onClose }: ResultDetailProps) {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState(result.notes ?? '')

  const verifyMutation = useMutation({
    mutationFn: (verified: boolean) => api.updateResult(result.id, { verified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchResults'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const notesMutation = useMutation({
    mutationFn: () => api.updateResult(result.id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchResults'] })
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-card mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-base font-semibold text-text-primary">{result.name}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Status & Verification */}
          <div className="flex items-center gap-3">
            {result.status === 'no_website' ? (
              <div className="flex items-center gap-2 text-success">
                <GlobeOff className="h-4 w-4" />
                <span className="text-sm font-medium">No Website — Lead</span>
              </div>
            ) : result.status === 'has_website' ? (
              <div className="flex items-center gap-2 text-text-muted">
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">Has Website</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-warning">
                <span className="text-sm font-medium">Pending Verification</span>
              </div>
            )}

            <div className="ml-auto">
              <button
                onClick={() => verifyMutation.mutate(!result.website_verified)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  result.website_verified
                    ? 'bg-success-dim text-success hover:bg-success/20'
                    : 'bg-bg-card text-text-secondary hover:bg-bg-card-hover border border-border'
                )}
              >
                <CheckCircle className="h-3 w-3" />
                {result.website_verified ? 'Verified' : 'Mark Verified'}
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            {result.address && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-text-muted" />
                <span className="text-sm text-text-secondary">{result.address}</span>
              </div>
            )}
            {result.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 flex-shrink-0 text-text-muted" />
                <span className="text-sm text-text-secondary">{result.phone}</span>
              </div>
            )}
            {result.rating && (
              <div className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5 flex-shrink-0 text-warning fill-warning" />
                <span className="text-sm text-text-secondary">
                  {result.rating.toFixed(1)} ({result.total_ratings} reviews)
                </span>
              </div>
            )}
            {result.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 flex-shrink-0 text-text-muted" />
                <a
                  href={result.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-accent hover:text-accent-hover"
                >
                  {result.website} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {result.network_site && (
              <div className="flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-text-muted" />
                <a
                  href={result.network_site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-accent hover:text-accent-hover"
                >
                  {result.network_site} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {result.categories && result.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {result.categories.map((cat) => (
                  <span key={cat} className="rounded-md bg-bg-primary px-2 py-0.5 text-xs text-text-muted">
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-muted">
              <StickyNote className="h-3 w-3" /> Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this business..."
              className="input-field min-h-[80px] resize-y"
            />
            {(notes !== (result.notes ?? '')) && (
              <button
                onClick={() => notesMutation.mutate()}
                disabled={notesMutation.isPending}
                className="btn-ghost mt-2 text-xs"
              >
                {notesMutation.isPending ? 'Saving...' : 'Save notes'}
              </button>
            )}
          </div>

          <div className="text-xs text-text-muted">
            Verified via {result.verification_method} • Added {new Date(result.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}
