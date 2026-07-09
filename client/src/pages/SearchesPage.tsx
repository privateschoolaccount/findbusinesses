import { SearchForm } from '@/components/searches/SearchForm'
import { SearchList } from '@/components/searches/SearchList'

export function SearchesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Searches</h1>
        <p className="mt-1 text-sm text-text-muted">Find businesses without websites</p>
      </div>

      <SearchForm />
      <SearchList />
    </div>
  )
}
