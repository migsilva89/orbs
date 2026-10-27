import { cn } from '../lib/cn';
import type { HTMLAttributes } from 'react';

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-accent', className)} data-slot="skeleton" {...props} />;
}

export { Skeleton };
