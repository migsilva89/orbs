import { queryMutationCache } from '@openbots/client/react';
import { log } from '@openbots/logger/client';
import { isCancelledError, QueryCache, QueryClient } from '@tanstack/react-query';
import { toasty } from '@/components/ui/sonner';

export function tanstackQueryContext() {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({}),
    mutationCache: queryMutationCache({
      notify: ({ message, variant }) => toasty(message, variant === 'error' ? '⚠️' : '✅'),
      onError: (error) => {
        if (!isCancelledError(error)) {
          log.error({ action: 'mutation_error', error });
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });

  return { queryClient };
}
