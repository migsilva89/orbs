import type { ReactNode } from 'react';

interface RoomsDetailsSectionProps {
  title: string
  action?: ReactNode
  children: ReactNode
}

export function RoomsDetailsSection({ title, action, children }: RoomsDetailsSectionProps) {
  return (
    <section aria-label={title} className="flex flex-col gap-1.5">
      <div className="flex min-h-6 items-center justify-between gap-2 px-3">
        <h3 className="truncate text-xs text-muted-foreground/80">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
