import type { SVGProps } from 'react';

export function SyncoraLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <rect width="40" height="40" rx="8" fill="#7B2FF7" />
      <circle cx="20" cy="20" r="10" stroke="white" strokeWidth="2" />
      <circle cx="20" cy="20" r="3" fill="white" />
    </svg>
  );
}

export function SyncoraWordmark() {
  return (
    <span className="text-sm font-bold">
      <span className="text-syncora-500">Sync</span>
      <span className="text-muted-foreground">ora</span>
    </span>
  );
}
