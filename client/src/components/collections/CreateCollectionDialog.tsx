import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { X, FolderPlus, MapPin, Tag } from 'lucide-react'

interface CreateCollectionDialogProps {
  onClose: () => void
}

export function CreateCollectionDialog({ onClose }: CreateCollectionDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      api.createCollection({
        name,
        location: location || undefined,
        tags: tagsInput
          ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-card mx-4 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-base font-semibold text-text-primary">New Collection</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-muted">
              <FolderPlus className="h-3 w-3" /> Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SF Restaurants Q1"
              className="input-field"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-muted">
              <MapPin className="h-3 w-3" /> Location (optional)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-muted">
              <Tag className="h-3 w-3" /> Tags (comma-separated, optional)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. restaurants, priority"
              className="input-field"
            />
          </div>

          {mutation.isError && (
            <p className="text-xs text-error">{mutation.error.message}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !name.trim()}
              className="btn-primary"
            >
              {mutation.isPending ? 'Creating...' : 'Create Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
