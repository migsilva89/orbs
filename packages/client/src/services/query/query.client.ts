import { MutationCache } from '@tanstack/react-query';
import type { QueryMutationCacheParams } from '../../types/query.types';

/** Shows each mutation's `meta` message and refreshes its `meta.invalidates` keys, so hooks declare them instead of wiring callbacks. */
export function queryMutationCache({ notify, onError }: QueryMutationCacheParams) {
  return new MutationCache({
    onError: (error, _variables, _result, mutation) => {
      onError?.(error);

      if (mutation.meta?.error) {
        notify({ message: mutation.meta.error, variant: 'error' });
      }
    },
    onSuccess: (_data, _variables, _result, mutation) => {
      if (mutation.meta?.success) {
        notify({ message: mutation.meta.success, variant: 'success' });
      }
    },
    onSettled: (_data, _error, _variables, _result, mutation, context) => Promise.all(
      (mutation.meta?.invalidates ?? []).map((queryKey) => context.client.invalidateQueries({ queryKey })),
    ),
  });
}
