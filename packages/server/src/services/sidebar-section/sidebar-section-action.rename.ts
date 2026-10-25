import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { sidebarSectionNotify, sidebarSectionRecord } from './sidebar-section.utils';
import type { SidebarSectionServiceDeps } from '../../types/sidebar-section.types';
import type { SidebarSectionRenameInput } from '@repo/contracts/universal';

export async function sidebarSectionActionRename(deps: SidebarSectionServiceDeps, { sectionId, name }: SidebarSectionRenameInput) {
  const row = await deps.database.db.updateTable('sidebarSection')
    .set({ name, updatedAt: Date.now() })
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
