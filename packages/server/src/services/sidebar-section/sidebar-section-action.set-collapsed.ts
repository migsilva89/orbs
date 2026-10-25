import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { sidebarSectionNotify, sidebarSectionRecord } from './sidebar-section.utils';
import type { SidebarSectionServiceDeps } from '../../types/sidebar-section.types';
import type { SidebarSectionSetCollapsedInput } from '@repo/contracts/universal';

export async function sidebarSectionActionSetCollapsed(deps: SidebarSectionServiceDeps, { sectionId, isCollapsed }: SidebarSectionSetCollapsedInput) {
  const row = await deps.database.db.updateTable('sidebarSection')
    .set({ isCollapsed: Number(isCollapsed), updatedAt: Date.now() })
    .where('id', '=', sectionId)
    .returningAll()
    .executeTakeFirst();

  const section = match(row)
    .with(P.nonNullable, (value) => value)
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'sidebar section' });
    });

  sidebarSectionNotify(deps);

  return sidebarSectionRecord(section);
}
