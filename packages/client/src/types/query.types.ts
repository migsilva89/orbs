import type { QueryKey } from '@tanstack/react-query';

/** What a mutation shows and refreshes; each app's query client handles it once instead of every hook. */
export interface QueryMutationMeta {
  [key: string]: unknown;
  error?: string;
  success?: string;
  invalidates?: QueryKey[];
}

export interface QueryNotifyParams {
  message: string;
  variant: 'error' | 'success';
}

export interface QueryMutationCacheParams {
  notify: (params: QueryNotifyParams) => void;
  onError?: (error: Error) => void;
}

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: QueryMutationMeta;
  }
}
