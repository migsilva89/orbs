import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ComponentProps } from 'react';

const ResponseContent = lazy(() => import('@/components/ui/ai/response-content').then((module) => ({ default: module.ResponseContent })));

export function Response(props: ComponentProps<typeof ResponseContent>) {
  return (
    <Suspense fallback={<Skeleton className="h-6 w-full" />}>
      <ResponseContent {...props} />
    </Suspense>
  );
}
