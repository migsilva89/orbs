import { useSidebarSections } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { match, P } from 'ts-pattern';
import { ConfirmationDialog } from '@/components/ui/alert-dialog';

export function RoomsSectionDeleteDialog() {
  const navigate = useNavigate();
  const { sectionDelete } = useSearch({ from: '/_chat' });
  const sidebarSections = useSidebarSections();
  const section = sidebarSections.sections.find((item) => item.id === sectionDelete);

  const close = () => void navigate({
    to: '.',
    search: (previous) => ({ ...previous, sectionDelete: undefined }),
    replace: true,
  });

  return match(section)
    .with(P.nonNullable, ({ id, name }) => (
      <ConfirmationDialog
        confirmLabel={m.rooms_section_delete()}
        pending={false}
        title={m.rooms_section_delete_title({ name })}
        variant="destructive"
        onConfirm={() => {
          sidebarSections.remove({ sectionId: id });
          close();
        }}
        onOpenChange={(open) => !open && close()}
      >
        {m.rooms_section_delete_description()}
      </ConfirmationDialog>
    ))
    .otherwise(() => null);
}
