import type { QueryKey } from '@tanstack/react-query';

export interface QueryMutationMeta {
  [key: string]: string | QueryKey[] | undefined;
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
