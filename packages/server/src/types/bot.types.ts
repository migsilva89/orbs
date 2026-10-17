import type { DatabaseService } from '../services/database/database.service';
import type { ResourceService } from '../services/resource/resource.service';
import type { RuntimeService } from '@openbots/runtime/server';

export interface BotDatabaseDeps {
  database: DatabaseService;
}

export interface BotServiceDeps extends BotDatabaseDeps {
  runtime: RuntimeService;
  resources: ResourceService;
}
