import type { DatabaseSidebarSection } from '../../types/database.types';
import type { SidebarSectionServiceDeps } from '../../types/sidebar-section.types';
import type { SidebarSection } from '@repo/contracts/universal';
import type { Selectable } from 'kysely';

export function sidebarSectionRecord(row: Selectable<DatabaseSidebarSection>): SidebarSection {
  return {
    id: row.id,
    name: row.name,
    rank: row.rank,
    isCollapsed: row.isCollapsed === 1,
  };
}

export function sidebarSectionNotify(deps: SidebarSectionServiceDeps) {
  for (const listener of deps.changes) {
    listener();
  }
}
