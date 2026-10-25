import { z } from 'zod';

export const sidebarSection = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(80),
  rank: z.number().int().nonnegative(),
  isCollapsed: z.boolean(),
});

export const sidebarSectionList = z.array(sidebarSection);

export const sidebarSectionCreate = z.object({
  name: sidebarSection.shape.name,
});

export const sidebarSectionRename = z.object({
  sectionId: z.uuid(),
  name: sidebarSection.shape.name,
});

export const sidebarSectionTarget = z.object({
  sectionId: z.uuid(),
});

export const sidebarSectionArrange = z.object({
  sectionIds: z.array(z.uuid()).max(1000).refine((ids) => new Set(ids).size === ids.length),
});

export const sidebarSectionSetCollapsed = sidebarSectionTarget.extend({
  isCollapsed: z.boolean(),
});

export const sidebarSectionVoid = z.void();

export type SidebarSection = z.infer<typeof sidebarSection>;
export type SidebarSectionCreateInput = z.infer<typeof sidebarSectionCreate>;
export type SidebarSectionRenameInput = z.infer<typeof sidebarSectionRename>;
export type SidebarSectionTarget = z.infer<typeof sidebarSectionTarget>;
export type SidebarSectionArrangeInput = z.infer<typeof sidebarSectionArrange>;
export type SidebarSectionSetCollapsedInput = z.infer<typeof sidebarSectionSetCollapsed>;
