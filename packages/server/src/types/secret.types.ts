import type { CredentialsService } from '../services/credentials/credentials.service';
import type { SettingsService } from '../services/settings/settings.service';

export interface SecretServiceDeps {
  credentials: CredentialsService;
  settings: SettingsService;
}

export interface SecretValueParams {
  name: string;
}
