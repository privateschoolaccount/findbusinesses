import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Ruler, Tag, Loader2 } from 'lucide-react'

export function SearchForm() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [radius, setRadius] = useState(5000)
  const [type, setType] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.createSearch({ query, location, radius, type: type || undefined }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['searches'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      navigate(`/searches/${data.id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || !location.trim()) return
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">New Search</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-muted">
            <Search className="h-3 w-3" /> Business Type
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "pizza", "dentist", "plumber"'
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-muted">
            <MapPin className="h-3 w-3" /> Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder='e.g. "New York, NY"'
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-muted">
            <Ruler className="h-3 w-3" /> Radius (meters)
          </label>
          <input
            type="number"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            min={1}
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-muted">
            <Tag className="h-3 w-3" /> Category Filter (optional)
          </label>
          <input
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="e.g. restaurant, store"
            className="input-field"
          />
        </div>
      </div>

      {mutation.isError && (
        <p className="mt-3 text-xs text-error">{mutation.error.message}</p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={mutation.isPending || !query.trim() || !location.trim()}
          className="btn-primary flex items-center gap-2"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" /> Search
            </>
          )}
        </button>
      </div>
    </form>
  )
}
