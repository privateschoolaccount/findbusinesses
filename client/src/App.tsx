import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { SearchesPage } from '@/pages/SearchesPage'
import { SearchDetailPage } from '@/pages/SearchDetailPage'
import { ResultsPage } from '@/pages/ResultsPage'
import { CollectionsPage } from '@/pages/CollectionsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/searches" element={<SearchesPage />} />
            <Route path="/searches/:id" element={<SearchDetailPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/collections/:id" element={<CollectionsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
