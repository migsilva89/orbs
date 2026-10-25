import { useSidebarSections } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { useRouter } from 'expo-router';
import { match, P } from 'ts-pattern';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useConnection } from '@/hooks/use-connection';

interface BotSectionDeleteDialogProps {
  sectionId: string;
}

export function BotSectionDeleteDialog({ sectionId }: BotSectionDeleteDialogProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, () => <BotSectionDeleteDialogContent sectionId={sectionId} />)
    .otherwise(() => null);
}

interface BotSectionDeleteDialogContentProps {
  sectionId: string;
}

function BotSectionDeleteDialogContent({ sectionId }: BotSectionDeleteDialogContentProps) {
  const router = useRouter();
  const sidebarSections = useSidebarSections();
  const name = sidebarSections.sections.find((section) => section.id === sectionId)?.name ?? '';

  return (
    <ConfirmDialog
      isDestructive
      confirmLabel={m.rooms_section_delete()}
      description={m.rooms_section_delete_description()}
      isPending={false}
      title={m.rooms_section_delete_title({ name })}
      onCancel={() => router.back()}
      onConfirm={() => {
        sidebarSections.remove({ sectionId });
        router.back();
      }}
    />
  );
}
