import type { RpcContextValue } from './rpc.types';
import type { QueryClient } from '@tanstack/react-query';

export interface ArtifactsStoreParams {
  rpc: RpcContextValue['rpc'];
  queryClient: QueryClient;
  botId: string;
  conversationId: number;
  artifactId: string;
  onError: () => void;
}

interface ArtifactsChartHeader {
  title?: string;
  value?: string;
  change?: string;
  caption?: string;
}

export type ArtifactsChart = ArtifactsChartHeader & (
  | { kind: 'line' | 'area' | 'bar'; data: Record<string, string | number | null>[]; x: string; series: { key: string; label: string }[] }
  | { kind: 'pie'; data: { label: string; value: number }[] }
);
