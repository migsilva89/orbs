import type { DatabaseService } from '../services/database/database.service';

export type SidebarSectionChangeListener = () => void;

export interface SidebarSectionServiceDeps {
  database: DatabaseService;
  changes: Set<SidebarSectionChangeListener>;
}
