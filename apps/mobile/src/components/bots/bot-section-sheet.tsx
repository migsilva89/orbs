import { useSidebarSections } from '@repo/client/react';
import { sidebarSectionCreate } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { match, P } from 'ts-pattern';
import { ActionSheet } from '@/components/ui/action-sheet';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { Text } from '@/components/ui/text';
import { useConnection } from '@/hooks/use-connection';
import type { SidebarSection } from '@repo/contracts/universal';

interface BotSectionSheetProps {
  sectionId?: string;
}

export function BotSectionSheet({ sectionId }: BotSectionSheetProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, () => <BotSectionSheetLoader sectionId={sectionId} />)
    .otherwise(() => null);
}

interface BotSectionSheetLoaderProps {
  sectionId?: string;
}

function BotSectionSheetLoader({ sectionId }: BotSectionSheetLoaderProps) {
  const sidebarSections = useSidebarSections();

  return match(sectionId)
    .with(P.string, (id) => match(sidebarSections.sections.find((section) => section.id === id))
      .with(P.nonNullable, (section) => <BotSectionSheetForm section={section} />)
      .otherwise(() => null))
    .otherwise(() => <BotSectionSheetForm />);
}

interface BotSectionSheetFormProps {
  section?: SidebarSection;
}

function BotSectionSheetForm({ section }: BotSectionSheetFormProps) {
  const router = useRouter();
  const sidebarSections = useSidebarSections();
  const [name, setName] = useState(section?.name ?? '');
  const parsed = sidebarSectionCreate.safeParse({ name });

  const save = () => {
    if (!parsed.success || sidebarSections.isCreating) {
      return;
    }

    match(section)
      .with(P.nonNullable, ({ id }) => {
        sidebarSections.rename({ sectionId: id, name: parsed.data.name });
        router.back();
      })
      .otherwise(() => sidebarSections.create(parsed.data, { onSuccess: () => router.back() }));
  };

  return (
    <ActionSheet>
      <Text variant="heading">{section ? m.rooms_section_rename() : m.rooms_section_create()}</Text>
      <FormInput
        // oxlint-disable-next-line jsx-a11y/no-autofocus -- the sheet exists only to type this name
        autoFocus
        hint={m.rooms_section_name_hint()}
        label={m.rooms_section_name()}
        maxLength={sidebarSectionCreate.shape.name.maxLength ?? undefined}
        returnKeyType="done"
        value={name}
        onChangeText={setName}
        onSubmitEditing={save}
      />
      <Button
        disabled={!parsed.success}
        loading={sidebarSections.isCreating}
        variant="primary"
        onPress={save}
      >
        {m.rooms_section_save()}
      </Button>
    </ActionSheet>
  );
}
