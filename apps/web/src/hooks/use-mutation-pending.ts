import { hashKey, useIsMutating } from '@tanstack/react-query';
import type { MutationKey } from '@tanstack/react-query';

export function useMutationPending(keys: MutationKey[]) {
  const hashes = new Set(keys.map((key) => hashKey(key)));

  return useIsMutating({ predicate: ({ options }) => hashes.has(hashKey(options.mutationKey ?? [])) }) > 0;
}
