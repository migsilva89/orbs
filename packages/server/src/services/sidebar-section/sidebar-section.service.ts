import { sidebarSectionActionArrange } from './sidebar-section-action.arrange';
import { sidebarSectionActionCreate } from './sidebar-section-action.create';
import { sidebarSectionActionRemove } from './sidebar-section-action.remove';
import { sidebarSectionActionRename } from './sidebar-section-action.rename';
import { sidebarSectionActionSetCollapsed } from './sidebar-section-action.set-collapsed';
import { sidebarSectionQueryList } from './sidebar-section-query.list';
import type * as SidebarSectionTypes from '../../types/sidebar-section.types';
import type * as UniversalTypes from '@repo/contracts/universal';

export function makeSidebarSectionService(deps: Omit<SidebarSectionTypes.SidebarSectionServiceDeps, 'changes'>) {
  const serviceDeps: SidebarSectionTypes.SidebarSectionServiceDeps = { ...deps, changes: new Set() };

  return {
    onChange: (listener: SidebarSectionTypes.SidebarSectionChangeListener) => {
      serviceDeps.changes.add(listener);
      return () => {
        serviceDeps.changes.delete(listener);
      };
    },
    actions: {
      create: (params: UniversalTypes.SidebarSectionCreateInput) => sidebarSectionActionCreate(serviceDeps, params),
      rename: (params: UniversalTypes.SidebarSectionRenameInput) => sidebarSectionActionRename(serviceDeps, params),
      remove: (params: UniversalTypes.SidebarSectionTarget) => sidebarSectionActionRemove(serviceDeps, params),
      arrange: (params: UniversalTypes.SidebarSectionArrangeInput) => sidebarSectionActionArrange(serviceDeps, params),
      setCollapsed: (params: UniversalTypes.SidebarSectionSetCollapsedInput) => sidebarSectionActionSetCollapsed(serviceDeps, params),
    },
    queries: {
      list: () => sidebarSectionQueryList(serviceDeps),
    },
  };
}

export type SidebarSectionService = ReturnType<typeof makeSidebarSectionService>;
