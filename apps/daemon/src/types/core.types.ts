import type { makeServices } from '@repo/server/server';

export interface CoreRpcNativeParams {
  isLocal?: boolean;
}

export interface CoreLocalNativeParams {
  directory: string;
}

export interface CoreServerAvatarParams {
  services: Awaited<ReturnType<typeof makeServices>>;
  path: string;
  peer: string | null;
}
