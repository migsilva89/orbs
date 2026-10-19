import type { QueryClient } from '@tanstack/react-query';

export interface ArtifactsRef {
  botId: string;
  conversationId: number;
  artifactId: string;
}

export interface ArtifactsStoreParams extends ArtifactsRef {
  queryClient: QueryClient;
  onError: () => void;
}

export type ArtifactsChart =
  | { kind: 'line' | 'area' | 'bar'; data: Record<string, string | number | null>[]; x: string; series: { key: string; label: string }[] }
  | { kind: 'pie'; data: { label: string; value: number }[] };
