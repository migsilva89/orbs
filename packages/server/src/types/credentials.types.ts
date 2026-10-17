import type { DatabaseService } from '../services/database/database.service';

export interface CredentialsServiceDeps {
  database: DatabaseService;
  key: CryptoKey;
}

export interface CredentialsGetParams {
  key: string;
}

export interface CredentialsSetParams extends CredentialsGetParams {
  value: string | null;
}
