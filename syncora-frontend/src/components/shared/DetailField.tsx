import type { ReactNode } from 'react';

interface DetailFieldProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  className?: string;
}

export function DetailField({
  icon,
  label,
  value,
  className,
}: DetailFieldProps) {
  return (
    <div className={className}>
      <p className="text-muted-foreground mb-1 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
