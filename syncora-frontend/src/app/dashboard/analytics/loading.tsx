import { CardSkeleton, TableSkeleton } from '@/components/shared/Skeleton';

export default function AnalyticsLoading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="h-5 w-32 bg-muted rounded animate-pulse mb-6" />
          <div className="h-[300px] bg-muted/30 rounded animate-pulse" />
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="h-5 w-32 bg-muted rounded animate-pulse mb-6" />
          <div className="h-[300px] bg-muted/30 rounded animate-pulse" />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="h-5 w-48 bg-muted rounded animate-pulse mb-6" />
        <TableSkeleton rows={4} />
      </div>
    </div>
  );
}
