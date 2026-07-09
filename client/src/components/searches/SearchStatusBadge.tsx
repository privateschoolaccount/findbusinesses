import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'badge-warning' },
  processing: { label: 'Processing', className: 'badge-accent' },
  completed: { label: 'Completed', className: 'badge-success' },
  failed: { label: 'Failed', className: 'badge-error' },
}

export function SearchStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: 'badge-accent' }
  return <span className={cn('badge', config.className)}>{config.label}</span>
}
