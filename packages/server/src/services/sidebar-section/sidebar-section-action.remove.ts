import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { sidebarSectionNotify } from './sidebar-section.utils';
import type { SidebarSectionServiceDeps } from '../../types/sidebar-section.types';
import type { SidebarSectionTarget } from '@repo/contracts/universal';

export async function sidebarSectionActionRemove(deps: SidebarSectionServiceDeps, { sectionId }: SidebarSectionTarget) {
  const row = await deps.database.db.deleteFrom('sidebarSection').where('id', '=', sectionId).returning('id').executeTakeFirst();

  match(row)
    .with(P.nonNullable, () => undefined)
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'sidebar section' });
    });

  sidebarSectionNotify(deps);
}
