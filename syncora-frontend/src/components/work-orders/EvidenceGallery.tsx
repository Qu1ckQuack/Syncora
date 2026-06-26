import { ImageIcon } from 'lucide-react';
import type { Evidence } from '@/lib/types';

export function EvidenceGallery({
  evidence,
  isLoading,
}: {
  evidence: Evidence[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="aspect-video rounded-md bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!evidence || evidence.length === 0) {
    return (
      <div className="flex min-h-[120px] flex-col items-center justify-center rounded-md border border-dashed border-border text-center">
        <ImageIcon
          className="h-5 w-5 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="mt-2 text-sm text-muted-foreground">
          No proof photos uploaded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {evidence.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="group overflow-hidden rounded-md border border-border bg-background"
        >
          {item.type === 'PHOTO' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt={
                'Proof uploaded by ' +
                (item.technician?.name ?? 'technician')
              }
              className="aspect-video w-full object-cover transition-transform group-hover:scale-[1.02]"
            />
          ) : (
            <video
              src={item.url}
              className="aspect-video w-full object-cover"
              controls
            />
          )}
          <div className="p-2 text-xs text-muted-foreground">
            {item.technician?.name ?? 'Technician'} -{' '}
            {new Date(item.createdAt).toLocaleString()}
          </div>
        </a>
      ))}
    </div>
  );
}
