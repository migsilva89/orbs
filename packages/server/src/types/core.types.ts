import type { DatabaseService } from '../services/database/database.service';
import type { RuntimeServiceParams } from '@openbots/runtime/server';

export interface CoreServicesParams extends RuntimeServiceParams {
  database: DatabaseService;
}
