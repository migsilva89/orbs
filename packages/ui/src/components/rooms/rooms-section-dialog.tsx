import { useSidebarSections } from '@repo/client/react';
import { sidebarSectionCreate } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useId, useState } from 'react';
import { match, P } from 'ts-pattern';
import { Button } from '../button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../dialog';
import { Input } from '../input';
import { Label } from '../label';
import type { SidebarSection } from '@repo/contracts/universal';

export function RoomsSectionDialog() {
  const { section: target } = useSearch({ from: '/_chat' });
  const { sections } = useSidebarSections();

  return match(target)
    .with(undefined, () => null)
    .with('create', () => <RoomsSectionDialogForm />)
    .otherwise((sectionId) => match(sections.find((section) => section.id === sectionId))
      .with(P.nonNullable, (section) => <RoomsSectionDialogForm key={section.id} section={section} />)
      .otherwise(() => null));
}

interface RoomsSectionDialogFormProps {
  section?: SidebarSection
}

function RoomsSectionDialogForm({ section }: RoomsSectionDialogFormProps) {
  const navigate = useNavigate();
  const sidebarSections = useSidebarSections();
  const nameId = useId();
  const hintId = useId();
  const [name, setName] = useState(section?.name ?? '');
  const parsed = sidebarSectionCreate.safeParse({ name });

  const close = () => void navigate({
    to: '.',
    search: (previous: object) => ({ ...previous, section: undefined }),
    replace: true,
  });

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{section ? m.rooms_section_rename() : m.rooms_section_create()}</DialogTitle>
          <DialogDescription id={hintId}>{m.rooms_section_name_hint()}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();

            if (!parsed.success) {
              return;
            }

            match(section)
              .with(P.nonNullable, ({ id }) => sidebarSections.rename({ sectionId: id, name: parsed.data.name }))
              .otherwise(() => sidebarSections.create(parsed.data));
            close();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor={nameId}>{m.rooms_section_name()}</Label>
            <Input
              required
              aria-describedby={hintId}
              autoComplete="off"
              id={nameId}
              maxLength={sidebarSectionCreate.shape.name.maxLength ?? undefined}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{m.ui_cancel()}</Button>
            </DialogClose>
            <Button disabled={!parsed.success} type="submit">{m.rooms_section_save()}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
