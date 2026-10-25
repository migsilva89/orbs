import { useSidebarSections } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { useRouter } from 'expo-router';
import { ContextMenu } from '@/components/ui/menu';
import { SectionHeading } from '@/components/ui/section-heading';
import type { MenuItem } from '@/types/menu.types';
import type { SidebarSection } from '@repo/contracts/universal';

interface BotSectionHeadingProps {
  section: SidebarSection;
  isSearching: boolean;
}

export function BotSectionHeading({ section, isSearching }: BotSectionHeadingProps) {
  const router = useRouter();
  const sidebarSections = useSidebarSections();
  const sectionIds = sidebarSections.sections.map((item) => item.id);
  const index = sectionIds.indexOf(section.id);
  const params = { sectionId: section.id };

  function move(offset: number) {
    const next = sectionIds.filter((sectionId) => sectionId !== section.id);
    next.splice(index + offset, 0, section.id);
    sidebarSections.arrange({ sectionIds: next });
  }

  const items: MenuItem[] = [
    { label: m.rooms_section_rename(), systemImage: 'pencil', onSelect: () => router.push({ pathname: '/sections/[sectionId]/rename', params }) },
    ...index > 0 ? [{ label: m.rooms_section_move_up(), systemImage: 'arrow.up', onSelect: () => move(-1) } satisfies MenuItem] : [],
    ...index < sectionIds.length - 1 ? [{ label: m.rooms_section_move_down(), systemImage: 'arrow.down', onSelect: () => move(1) } satisfies MenuItem] : [],
    {
      label: m.rooms_section_delete(),
      systemImage: 'trash',
      isDestructive: true,
      hasDividerBefore: true,
      onSelect: () => router.push({ pathname: '/sections/[sectionId]/delete', params }),
    },
  ];

  return (
    <ContextMenu
      isFullWidth
      items={items}
      title={section.name}
    >
      <SectionHeading
        disabled={isSearching}
        expanded={!section.isCollapsed || isSearching}
        label={section.name}
        onPress={() => sidebarSections.setCollapsed({ sectionId: section.id, isCollapsed: !section.isCollapsed })}
      />
    </ContextMenu>
  );
}
