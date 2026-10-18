import type { DatabaseService } from '../services/database/database.service';

export interface CollaborationServiceDeps {
  database: DatabaseService;
}
