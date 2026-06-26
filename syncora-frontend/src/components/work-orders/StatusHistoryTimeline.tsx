import { History } from 'lucide-react';
import { StatusPill } from '@/components/shared/StatusPill';

interface StatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  createdAt: string;
  note?: string | null;
  changedBy?: { id?: string; name?: string } | null;
}

export function StatusHistoryTimeline({
  entries,
}: {
  entries: StatusHistoryEntry[];
}) {
  if (!entries || entries.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Status History</h2>
      </div>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 text-sm">
            <div className="flex flex-col items-center">
              <div className="h-2.5 w-2.5 rounded-full bg-syncora-500 mt-1.5" />
              <div className="w-px flex-1 bg-border min-h-4" />
            </div>
            <div className="flex-1 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {entry.fromStatus ?? 'Created'}
                </span>
                <span className="text-muted-foreground">{'\u2192'}</span>
                <StatusPill status={entry.toStatus} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                by {entry.changedBy?.name ?? 'System'} {'\u00B7'}{' '}
                {new Date(entry.createdAt).toLocaleString()}
              </p>
              {entry.note && (
                <p className="text-xs text-muted-foreground mt-0.5 italic">
                  {entry.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
