import { z } from 'zod';
import type { Bot, ConversationWhenBusy } from '@repo/contracts/universal';
import type { Generated } from 'kysely';
import type { DatabaseSync } from 'node:sqlite';

export interface DatabaseBot extends Omit<Bot, 'avatar' | 'inherit' | 'fallbackModel'> {
  avatar: string | null;
  inherit: string;
  fallbackModel: string | null;
}

export interface DatabaseBotPreference {
  botId: string;
  isPinned: Generated<number>;
  isHidden: Generated<number>;
  rank: number | null;
  isMuted: Generated<number>;
  mutedUntil: number | null;
  readThroughEntryId: Generated<number>;
  whenBusy: ConversationWhenBusy | null;
  updatedAt: number;
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
  botPreference: DatabaseBotPreference;
  device: {
    id: string;
    name: string;
    tokenHash: string;
    createdAt: number;
    pushToken: string | null;
    pushUrl: string | null;
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
