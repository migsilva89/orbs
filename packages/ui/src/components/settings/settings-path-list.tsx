import { skillSettings } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { useState } from 'react';
import IconPlus from '~icons/lucide/plus';
import IconTrash2 from '~icons/lucide/trash-2';
import { Button } from '../button';
import { FormErrors } from '../forms/form';
import { Input } from '../input';

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
  const [isAdding, setIsAdding] = useState(false);
  const path = skillSettings.shape.directories.element.safeParse(draft);
  const isValid = path.success && !paths.includes(path.data);

  function add() {
    onChange([...paths, skillSettings.shape.directories.element.parse(draft)]);
    setDraft('');
    setIsAdding(false);
  }

  function cancel() {
    setDraft('');
    setIsAdding(false);
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Button
          aria-expanded={isAdding}
          aria-label={m.settings_paths_add()}
          className="mr-1.5"
          disabled={isPending}
          size="icon-sm"
          title={m.settings_paths_add()}
          type="button"
          variant="ghost"
          onClick={() => (isAdding ? cancel() : setIsAdding(true))}
        >
          <IconPlus className="size-4" />
        </Button>
      </div>
      {isAdding ? (
        <form
          className="flex items-center gap-2"
          data-escape="local"
          onSubmit={(event) => {
            event.preventDefault();
            if (isValid) {
              add();
            }
          }}
        >
          <Input
            aria-label={title}
            disabled={isPending}
            maxLength={4096}
            placeholder={placeholder}
            ref={(node) => node?.focus()}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => event.key === 'Escape' && cancel()}
          />
          <Button
            disabled={isPending || !isValid}
            type="submit"
            variant="outline"
          >
            {m.settings_paths_add()}
          </Button>
        </form>
      ) : null}
      <FormErrors error={isFailed ? m.settings_paths_error() : undefined} />
      {paths.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {paths.map((item) => (
            <li className="flex h-9 items-center gap-2 rounded-md border bg-background/40 pr-1.5 pl-3" key={item}>
              <span className="min-w-0 flex-1 truncate font-mono text-sm" title={item}>{item}</span>
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
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
