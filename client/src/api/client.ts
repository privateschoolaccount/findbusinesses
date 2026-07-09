import type {
  SearchCreate,
  SearchResponse,
  SearchListResponse,
  ResultResponse,
  ResultListResponse,
  StatsResponse,
  CollectionCreate,
  CollectionUpdate,
  CollectionResponse,
  ResultUpdate,
} from '@/types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  // Health
  health: () => request<{ status: string }>('/health'),

  // Stats
  getStats: () => request<StatsResponse>('/stats'),

  // Searches
  listSearches: (params?: { page?: number; limit?: number; status?: string }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.status) q.set('status', params.status)
    const qs = q.toString()
    return request<SearchListResponse>(`/searches${qs ? `?${qs}` : ''}`)
  },

  createSearch: (data: SearchCreate, wait = false) =>
    request<SearchResponse & { results?: ResultResponse[] }>(
      `/searches${wait ? '?wait=true' : ''}`,
      { method: 'POST', body: JSON.stringify(data) }
    ),

  getSearch: (id: string) => request<SearchResponse>(`/searches/${id}`),

  getSearchResults: (id: string, params?: { page?: number; limit?: number; status?: string }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.status) q.set('status', params.status)
    const qs = q.toString()
    return request<ResultListResponse>(`/searches/${id}/results${qs ? `?${qs}` : ''}`)
  },

  // Results
  getResult: (id: string) => request<ResultResponse>(`/results/${id}`),

  updateResult: (id: string, data: ResultUpdate) =>
    request<ResultResponse>(`/results/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Collections
  listCollections: () => request<CollectionResponse[]>('/collections'),

  createCollection: (data: CollectionCreate) =>
    request<CollectionResponse>('/collections', { method: 'POST', body: JSON.stringify(data) }),

  getCollection: (id: number) => request<CollectionResponse>(`/collections/${id}`),

  updateCollection: (id: number, data: CollectionUpdate) =>
    request<CollectionResponse>(`/collections/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteCollection: (id: number) =>
    request<void>(`/collections/${id}`, { method: 'DELETE' }),

  getCollectionBusinesses: (id: number, params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    const qs = q.toString()
    return request<ResultListResponse>(`/collections/${id}/businesses${qs ? `?${qs}` : ''}`)
  },

  addBusinessesToCollection: (id: number, resultIds: string[]) =>
    request<{ success: boolean }>(`/collections/${id}/businesses`, {
      method: 'POST',
      body: JSON.stringify({ resultIds }),
    }),

  removeBusinessFromCollection: (collectionId: number, resultId: string) =>
    request<void>(`/collections/${collectionId}/businesses/${resultId}`, { method: 'DELETE' }),
}
