import { z } from 'zod';
import type { Bot } from '@openbots/contracts/universal';
import type { DatabaseSync } from 'node:sqlite';

export interface DatabaseBot extends Omit<Bot, 'avatar' | 'inherit'> {
  avatar: string | null;
  inherit: string;
}

export interface DatabaseSchema {
  settings: {
    key: string;
    value: string;
    updatedAt: number;
  };
  credentials: {
    key: string;
    value: string;
    iv: string;
    createdAt: number;
    updatedAt: number;
  };
  bot: DatabaseBot;
  device: {
    id: string;
    name: string;
    tokenHash: string;
    createdAt: number;
  };
  pairingGrant: {
    tokenHash: string;
    issuedBy: string | null;
    expiresAt: number;
    claimedAt: number | null;
  };
}

export interface DatabaseServiceParams {
  path: string;
  migrations?: Record<string, string>;
}

export const databaseDriverBindings = z.array(z.union([
  z.null(), z.string(), z.number(), z.bigint(), z.boolean().transform(Number), z.instanceof(Uint8Array),
]));

export interface DatabaseDriverParams {
  database: DatabaseSync;
}

export interface DatabaseDriverMigrationsParams extends DatabaseDriverParams {
  migrations: Record<string, string>;
}
