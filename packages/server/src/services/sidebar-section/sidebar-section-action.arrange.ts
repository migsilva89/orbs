import { Errors } from '@repo/errors/universal';
import { match } from 'ts-pattern';
import { sidebarSectionNotify } from './sidebar-section.utils';
import type { SidebarSectionServiceDeps } from '../../types/sidebar-section.types';
import type { SidebarSectionArrangeInput } from '@repo/contracts/universal';

export async function sidebarSectionActionArrange(deps: SidebarSectionServiceDeps, { sectionIds }: SidebarSectionArrangeInput) {
  await deps.database.db.transaction().execute(async (tx) => {
    const found = await tx.selectFrom('sidebarSection').select('id')
      .where('id', 'in', match(sectionIds).with([], () => ['']).otherwise((ids) => ids))
      .execute();

    match(found.length === sectionIds.length)
      .with(true, () => undefined)
      .with(false, () => {
        throw new Errors.NOT_FOUND({ resource: 'sidebar section' });
      })
      .exhaustive();

    const now = Date.now();
    await Promise.all(sectionIds.map((sectionId, rank) => tx.updateTable('sidebarSection')
      .set({ rank, updatedAt: now })
      .where('id', '=', sectionId)
      .execute()));
  });

  sidebarSectionNotify(deps);
}
