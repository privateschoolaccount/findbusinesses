import { StatsCards } from '@/components/dashboard/StatsCards'
import { RecentSearches } from '@/components/dashboard/RecentSearches'
import { LeadOverview } from '@/components/dashboard/LeadOverview'

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-text-muted">Overview of your lead generation activity</p>
      </div>

      <StatsCards />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentSearches />
        <LeadOverview />
      </div>
    </div>
  )
}
