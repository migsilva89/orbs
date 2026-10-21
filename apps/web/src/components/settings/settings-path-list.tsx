import { skillSettings } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormErrors } from '@/components/ui/forms/form';
import { Input } from '@/components/ui/input';
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from '@/components/ui/item';
import IconTrash2 from '~icons/lucide/trash-2';

interface SettingsPathListProps {
  title: string
  placeholder: string
  paths: string[]
  isPending: boolean
  isFailed: boolean
  onChange: (paths: string[]) => void
}

export function SettingsPathList({ title, placeholder, paths, isPending, isFailed, onChange }: SettingsPathListProps) {
  const [draft, setDraft] = useState('');
  const path = skillSettings.shape.directories.element.safeParse(draft);
  const isValid = path.success && !paths.includes(path.data);

  function add() {
    onChange([...paths, skillSettings.shape.directories.element.parse(draft)]);
    setDraft('');
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="flex items-center gap-2">
        <Input
          aria-label={title}
          disabled={isPending}
          maxLength={4096}
          placeholder={placeholder}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button
          disabled={isPending || !isValid}
          type="button"
          variant="outline"
          onClick={add}
        >
          {m.settings_paths_add()}
        </Button>
      </div>
      <FormErrors error={isFailed ? m.settings_paths_error() : undefined} />
      {paths.length > 0 ? (
        <ItemGroup variant="outline">
          {paths.map((item) => (
            <Item key={item} size="sm">
              <ItemContent className="min-w-0">
                <ItemTitle className="w-full"><span className="truncate font-mono" title={item}>{item}</span></ItemTitle>
              </ItemContent>
              <ItemActions>
                <Button
                  aria-label={m.settings_paths_delete()}
                  disabled={isPending}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                  onClick={() => onChange(paths.filter((candidate) => candidate !== item))}
                >
                  <IconTrash2 className="size-4" />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      ) : null}
    </section>
  );
}
