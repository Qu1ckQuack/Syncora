import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <main className="flex flex-col items-center gap-8 text-center">
        <div className="flex items-center gap-2">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect width="40" height="40" rx="8" fill="#7B2FF7" />
            <circle cx="20" cy="20" r="10" stroke="white" strokeWidth="2" />
            <circle cx="20" cy="20" r="3" fill="white" />
            <line x1="20" y1="6" x2="20" y2="14" stroke="white" strokeWidth="2" />
            <line x1="20" y1="26" x2="20" y2="34" stroke="white" strokeWidth="2" />
            <line x1="6" y1="20" x2="14" y2="20" stroke="white" strokeWidth="2" />
            <line x1="26" y1="20" x2="34" y2="20" stroke="white" strokeWidth="2" />
          </svg>
          <h1 className="text-2xl font-bold">
            <span className="text-syncora-500">Sync</span>
            <span className="text-muted-foreground">ora</span>
          </h1>
        </div>

        <p className="text-muted-foreground max-w-md">
          Real-time work-order management platform for field-service operations.
        </p>

        <div className="flex gap-4">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-syncora-500 px-6 text-sm font-medium text-white hover:bg-syncora-600 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-6 text-sm font-medium hover:bg-accent transition-colors"
          >
            Register
          </Link>
        </div>
      </main>
    </div>
  );
}
