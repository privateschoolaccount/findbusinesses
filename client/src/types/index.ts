export interface SearchCreate {
  query: string
  location: string
  radius?: number
  type?: string
}

export interface SearchResponse {
  id: string
  query: string
  location: string
  radius: number
  type: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_found: number
  with_website: number
  without_website: number
  pending_verification: number
  error: string | null
  created_at: string
  completed_at: string | null
}

export interface SearchListResponse {
  rows: SearchResponse[]
  total: number
  page: number
  limit: number
}

export interface ResultResponse {
  id: string
  search_id: string
  name: string
  address: string | null
  phone: string | null
  place_id: string | null
  website: string | null
  network_site: string | null
  website_verified: boolean
  website_confirmed: boolean
  status: 'has_website' | 'no_website' | 'pending_verification'
  verification_method: string
  rating: number | null
  total_ratings: number | null
  categories: string[] | null
  lat: number | null
  lng: number | null
  notes: string | null
  created_at: string
}

export interface ResultListResponse {
  rows: ResultResponse[]
  total: number
  page: number
  limit: number
}

export interface StatsResponse {
  total_searches: number
  completed_searches: number
  total_results: number
  without_website: number
  with_website: number
  pending_verification: number
  verified_count: number
}

export interface CollectionCreate {
  name: string
  location?: string
  tags?: string[]
}

export interface CollectionUpdate {
  name?: string
  location?: string
  tags?: string[]
}

export interface CollectionResponse {
  id: number
  name: string
  location: string | null
  tags: string[] | null
  totalLeads: number
  noWebsite: number
  newLeads: number
  created_at: string
  updated_at: string
}

export interface ResultUpdate {
  verified?: boolean
  notes?: string
}

export interface AddBusinessesRequest {
  resultIds: string[]
}
