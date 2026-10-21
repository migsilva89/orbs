import { toolApprovalRules } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import IconPencil from '~icons/lucide/pencil';
import IconTrash2 from '~icons/lucide/trash-2';
import type { ToolApprovalRule, ToolSettingsForm } from '@openbots/contracts/universal';

const SETTINGS_TOOLS_RULE_BEHAVIOR = {
  allow: m.settings_tools_rules_allow,
  ask: m.settings_tools_rules_ask,
} satisfies Record<ToolApprovalRule['behavior'], () => string>;

interface SettingsToolsRulesProps {
  disabled: boolean
}

export function SettingsToolsRules({ disabled }: SettingsToolsRulesProps) {
  const { control } = useFormContext<ToolSettingsForm>();
  const rules = useFieldArray({ control, name: 'approvalRules' });
  const [draft, setDraft] = useState<ToolApprovalRule>({ when: '', behavior: 'allow' });
  const [editing, setEditing] = useState<number | null>(null);
  const isValid = toolApprovalRules.element.safeParse(draft).success;

  function submit() {
    const rule = toolApprovalRules.element.parse(draft);

    if (editing === null) {
      rules.append(rule);
    } else {
      rules.update(editing, rule);
    }

    setDraft({ when: '', behavior: draft.behavior });
    setEditing(null);
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{m.settings_tools_rules()}</h3>
      <Input
        aria-label={m.settings_tools_rules_when()}
        disabled={disabled}
        maxLength={300}
        placeholder={m.settings_tools_rules_when_placeholder()}
        value={draft.when}
        onChange={(event) => setDraft({ ...draft, when: event.target.value })}
      />
      <div className="flex items-center justify-between gap-2">
        <Select
          disabled={disabled}
          value={draft.behavior}
          onValueChange={(next) => setDraft({ ...draft, behavior: toolApprovalRules.element.shape.behavior.parse(next) })}
        >
          <SelectTrigger aria-label={m.settings_tools_rules_behavior()} className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {toolApprovalRules.element.shape.behavior.options.map((behavior) => (
              <SelectItem key={behavior} value={behavior}>{SETTINGS_TOOLS_RULE_BEHAVIOR[behavior]()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          disabled={disabled || !isValid}
          type="button"
          variant="outline"
          onClick={submit}
        >
          {editing === null ? m.settings_tools_rules_add() : m.settings_tools_rules_save()}
        </Button>
      </div>
      {rules.fields.length > 0 ? (
        <ItemGroup variant="outline">
          {rules.fields.map((rule, index) => (
            <Item key={rule.id} size="sm">
              <ItemContent className="min-w-0">
                <ItemTitle className="w-full"><span className="truncate" title={rule.when}>{rule.when}</span></ItemTitle>
              </ItemContent>
              <ItemActions>
                <ItemDescription>{SETTINGS_TOOLS_RULE_BEHAVIOR[rule.behavior]()}</ItemDescription>
                <Button
                  aria-label={m.settings_tools_rules_edit()}
                  disabled={disabled}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setDraft({ when: rule.when, behavior: rule.behavior });
                    setEditing(index);
                  }}
                >
                  <IconPencil className="size-4" />
                </Button>
                <Button
                  aria-label={m.settings_tools_rules_delete()}
                  disabled={disabled}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    rules.remove(index);
                    setEditing(null);
                  }}
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
