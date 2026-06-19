'use client';

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h2 className="text-lg font-semibold">Failed to load analytics</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        {error.message || 'Something went wrong while fetching analytics data.'}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-syncora-500 px-4 py-2 text-sm font-medium text-white hover:bg-syncora-600 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
