import type { SqliteTelemetry } from '@earendil-works/chord/telemetry-sqlite';
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

export interface StorageTelemetry {
  telemetry: SqliteTelemetry;
  close(): Promise<void>;
}

export interface StorageService {
  open(params: StorageBotParams): Promise<Storage>;
  openTelemetry(params: StorageBotParams): Promise<StorageTelemetry>;
  reset(params: StorageBotParams): Promise<void>;
  remove(params: StorageBotParams): Promise<void>;
  saveCarry(params: StorageCarryParams): Promise<void>;
  readCarry(params: StorageBotParams): Promise<JsonObject | null>;
  removeCarry(params: StorageBotParams): Promise<void>;
}
