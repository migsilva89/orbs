import { m } from '@repo/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { match } from 'ts-pattern';
import { useRpc } from './use-rpc';
import type * as UniversalTypes from '@repo/contracts/universal';

/** Sidebar sections and their mutations; the live chat list watch pushes every change, including other devices'. */
export function useSidebarSections() {
  const { rpc } = useRpc();
  const queryClient = useQueryClient();
  const queryKey = rpc.sidebarSections.list.queryKey();
  const query = useQuery(rpc.sidebarSections.list.queryOptions());
  const meta = { error: m.rooms_sections_failed() };
  const restore = async () => queryClient.invalidateQueries({ queryKey });
  const create = useMutation(rpc.sidebarSections.create.mutationOptions({ meta }));
  const rename = useMutation(rpc.sidebarSections.rename.mutationOptions({ meta }));
  const remove = useMutation(rpc.sidebarSections.remove.mutationOptions({ meta }));
  const arrange = useMutation(rpc.sidebarSections.arrange.mutationOptions({ meta, onError: restore }));
  const setCollapsed = useMutation(rpc.sidebarSections.setCollapsed.mutationOptions({ meta, onError: restore }));

  return {
    sections: query.data ?? [],
    create: create.mutate,
    rename: rename.mutate,
    remove: remove.mutate,
    arrange: ({ sectionIds }: UniversalTypes.SidebarSectionArrangeInput) => {
      queryClient.setQueryData(queryKey, (sections = []) => sections
        .map((section) => ({ ...section, rank: sectionIds.includes(section.id) ? sectionIds.indexOf(section.id) : section.rank }))
        .sort((first, second) => first.rank - second.rank));
      arrange.mutate({ sectionIds });
    },
    setCollapsed: ({ sectionId, isCollapsed }: UniversalTypes.SidebarSectionSetCollapsedInput) => {
      queryClient.setQueryData(queryKey, (sections = []) => sections.map((section) => match(section.id)
        .with(sectionId, () => ({ ...section, isCollapsed }))
        .otherwise(() => section)));
      setCollapsed.mutate({ sectionId, isCollapsed });
    },
  };
}
