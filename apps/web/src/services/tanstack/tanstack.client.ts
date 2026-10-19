import { log } from '@openbots/logger/client';
import { isCancelledError, QueryCache, QueryClient } from '@tanstack/react-query';

export function tanstackQueryContext() {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({}),
    defaultOptions: {
      mutations: {
        onError: (error) => {
          if (isCancelledError(error)) {
            return;
          }

          log.error({ action: 'mutation_error', error });
        },
      },
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });

  return { queryClient };
}
