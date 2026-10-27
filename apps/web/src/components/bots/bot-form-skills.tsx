import { m } from '@repo/i18n/client';
import { Button } from '@repo/ui/button';
import { Checkbox } from '@repo/ui/checkbox';
import { FormErrors } from '@repo/ui/forms/form';
import { Input } from '@repo/ui/input';
import { Panel, PanelRow } from '@repo/ui/panel';
import { Skeleton } from '@repo/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { rpc } from '@/services/rpc/rpc.client';
import type { BotForm } from '@repo/contracts/universal';

interface BotFormSkillsProps {
  botId: string
  busy: boolean
}

export function BotFormSkills({ botId, busy }: BotFormSkillsProps) {
  const form = useFormContext<BotForm>();
  const [inherit, sharedSkills] = useWatch({ control: form.control, name: ['inherit', 'sharedSkills'] });
  const shared = useQuery(rpc.skills.shared.queryOptions({ input: { botId } }));
  const [search, setSearch] = useState('');

  const skills = [...(shared.data ?? [])].sort((left, right) => left.name.localeCompare(right.name));
  const names = skills.map((skill) => skill.name);
  const selected = new Set(inherit.includes('skills') ? sharedSkills ?? names : []);
  const query = search.trim().toLowerCase();
  const visible = skills.filter((skill) => `${skill.name} ${skill.description}`.toLowerCase().includes(query));
  const count = names.filter((name) => selected.has(name)).length;

  function choose(next: Set<string>) {
    const picked = names.filter((name) => next.has(name));
    const withoutSkills = inherit.filter((resource) => resource !== 'skills');

    form.setValue('inherit', picked.length === 0 ? withoutSkills : [...withoutSkills, 'skills'], { shouldDirty: true });
    form.setValue('sharedSkills', picked.length === 0 || picked.length === names.length ? null : picked, { shouldDirty: true });
  }

  function toggle(name: string, isChecked: boolean) {
    const next = new Set(selected);

    if (isChecked) {
      next.add(name);
    } else {
      next.delete(name);
    }
    choose(next);
  }

  if (shared.isPending) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (shared.isError) {
    return <FormErrors error={m.bots_skills_load_failed()} />;
  }

  if (skills.length === 0) {
    return <p className="text-sm text-muted-foreground">{m.bots_skills_empty()}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        aria-label={m.bots_skills_search()}
        placeholder={m.bots_skills_search()}
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="flex flex-col">
        <div className="flex items-center justify-between gap-2 pb-2">
          <p className="text-sm text-muted-foreground">{m.bots_skills_selected({ selected: String(count), total: String(names.length) })}</p>
          <div className="flex gap-1">
            <Button
              disabled={busy}
              size="xs"
              type="button"
              variant="ghost"
              onClick={() => choose(new Set(names))}
            >
              {m.bots_skills_all()}
            </Button>
            <Button
              disabled={busy}
              size="xs"
              type="button"
              variant="ghost"
              onClick={() => choose(new Set())}
            >
              {m.bots_skills_none()}
            </Button>
          </div>
        </div>
        <Panel variant="soft">
          {visible.map((skill) => (
            <label
              className="flex cursor-pointer items-start gap-3 px-4 py-2.5 hover:bg-muted/40"
              htmlFor={`skill-${skill.name}`}
              key={skill.name}
            >
              <Checkbox
                checked={selected.has(skill.name)}
                className="mt-0.5"
                disabled={busy}
                id={`skill-${skill.name}`}
                onCheckedChange={(checked) => toggle(skill.name, checked === true)}
              />
              <span className="flex min-w-0 flex-col">
                <span className="font-mono text-sm font-medium">{skill.name}</span>
                <span className="truncate text-xs text-muted-foreground" title={skill.description}>{skill.description}</span>
              </span>
            </label>
          ))}
          {visible.length === 0 ? <PanelRow><span className="text-sm text-muted-foreground">{m.bots_skills_no_match()}</span></PanelRow> : null}
        </Panel>
      </div>
      <p className="text-xs text-muted-foreground">{m.bots_skills_note()}</p>
    </div>
  );
}
