import type { JsonObject, Storage } from '@earendil-works/pi-durable';

export interface StorageLockParams {
  path: string;
}

export interface StorageServiceParams {
  root: string;
}

export interface StorageBotParams {
  botId: string;
}

export interface StorageCarryParams extends StorageBotParams {
  carry: JsonObject;
}

/** Per-bot Pi store files. A pending carry file survives a crash between clearing a store and refilling it. */
export interface StorageService {
  open(params: StorageBotParams): Promise<Storage>;
  reset(params: StorageBotParams): Promise<void>;
  remove(params: StorageBotParams): Promise<void>;
  saveCarry(params: StorageCarryParams): Promise<void>;
  readCarry(params: StorageBotParams): Promise<JsonObject | null>;
  removeCarry(params: StorageBotParams): Promise<void>;
}
