import type { DatabaseService } from '../services/database/database.service';
import type { ResourceDriver } from './resource.types';
import type { RuntimeServiceParams } from '@openbots/runtime/server';

export interface CoreServicesParams {
  database: DatabaseService;
  credentialsKey: CryptoKey;
  resourceDriver: ResourceDriver;
  runtime: Omit<RuntimeServiceParams, 'permissions'>;
}
