import type { DatabaseService } from '../services/database/database.service';

export interface SettingsServiceDeps {
  database: DatabaseService;
}

export interface SettingsRecord {
  key: string;
  value: string;
}

export interface SettingsGetParams {
  keys: string[];
}

export interface SettingsSetParams {
  records: SettingsRecord[];
}
