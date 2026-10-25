import { sidebarSectionNotify, sidebarSectionRecord } from './sidebar-section.utils';
import type { SidebarSectionServiceDeps } from '../../types/sidebar-section.types';
import type { SidebarSectionCreateInput } from '@repo/contracts/universal';

export async function sidebarSectionActionCreate(deps: SidebarSectionServiceDeps, { name }: SidebarSectionCreateInput) {
  const last = await deps.database.db.selectFrom('sidebarSection').select('rank').orderBy('rank', 'desc').executeTakeFirst();

  const row = await deps.database.db.insertInto('sidebarSection').values({
    id: crypto.randomUUID(),
    name,
    rank: (last?.rank ?? -1) + 1,
    updatedAt: Date.now(),
  }).returningAll().executeTakeFirstOrThrow();

  sidebarSectionNotify(deps);

  return sidebarSectionRecord(row);
}
