import { sidebarSectionRecord } from './sidebar-section.utils';
import type { SidebarSectionServiceDeps } from '../../types/sidebar-section.types';

export async function sidebarSectionQueryList({ database }: SidebarSectionServiceDeps) {
  const rows = await database.db.selectFrom('sidebarSection').selectAll().orderBy('rank').orderBy('id').execute();

  return rows.map(sidebarSectionRecord);
}
