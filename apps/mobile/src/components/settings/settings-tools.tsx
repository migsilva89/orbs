import { useSettingsTools } from '@openbots/client/react';
import { TOOL_APPROVAL, toolApprovalRules } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { Pencil, ShieldCheck, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { BotDetailsSection } from '@/components/bots/bot-details-section';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Item, ItemContent, ItemGroup, ItemTitle, ItemValue } from '@/components/ui/item';
import { LabelDescription } from '@/components/ui/label';
import { Menu } from '@/components/ui/menu';
import { Text } from '@/components/ui/text';
import type { ToolApprovalRule, ToolSettings } from '@openbots/contracts/universal';

const SETTINGS_TOOLS_RULE_BEHAVIOR = {
  allow: m.settings_tools_rules_allow,
  ask: m.settings_tools_rules_ask,
} satisfies Record<ToolApprovalRule['behavior'], () => string>;

export function SettingsTools() {
  const [saves, setSaves] = useState(0);
  const tools = useSettingsTools({ onDone: () => setSaves(saves + 1) });

  return (
    <BotDetailsSection
      icon={ShieldCheck}
      title={m.settings_tools()}
    >
      {tools.settings.data ? (
        <SettingsToolsForm
          key={saves}
          settings={tools.settings.data}
          tools={tools}
        />
      ) : null}
    </BotDetailsSection>
  );
}

interface SettingsToolsFormProps {
  settings: ToolSettings;
  tools: ReturnType<typeof useSettingsTools>;
}

function SettingsToolsForm({ settings, tools }: SettingsToolsFormProps) {
  const [rules, setRules] = useState(settings.approvalRules);
  const [draft, setDraft] = useState<ToolApprovalRule>({ when: '', behavior: 'allow' });
  const [editing, setEditing] = useState<number | null>(null);
  const [jevApiKey, setJevApiKey] = useState('');
  const [approvalTimeoutMinutes, setApprovalTimeoutMinutes] = useState(settings.approvalTimeoutMinutes);
  const isValid = toolApprovalRules.element.safeParse(draft).success;

  const submitRule = () => {
    const rule = toolApprovalRules.element.parse(draft);

    setRules(editing === null ? [...rules, rule] : rules.map((item, index) => (index === editing ? rule : item)));
    setDraft({ when: '', behavior: draft.behavior });
    setEditing(null);
  };

  return (
    <View className="gap-3 rounded-lg border border-border bg-card p-3">
      <Text variant="label">{m.settings_tools_rules()}</Text>
      <Input
        accessibilityLabel={m.settings_tools_rules_when()}
        autoCapitalize="none"
        editable={!tools.isPending}
        maxLength={300}
        placeholder={m.settings_tools_rules_when_placeholder()}
        value={draft.when}
        onChangeText={(when) => setDraft({ ...draft, when })}
      />
      <View className="flex-row items-center justify-between gap-2">
        <Menu
          items={toolApprovalRules.element.shape.behavior.options.map((behavior) => ({
            label: SETTINGS_TOOLS_RULE_BEHAVIOR[behavior](),
            systemImage: behavior === draft.behavior ? 'checkmark' : undefined,
            onSelect: () => setDraft({ ...draft, behavior }),
          }))}
          title={m.settings_tools_rules_behavior()}
        >
          <Button size="sm" variant="outline">{SETTINGS_TOOLS_RULE_BEHAVIOR[draft.behavior]()}</Button>
        </Menu>
        <Button
          disabled={tools.isPending || !isValid}
          size="sm"
          variant="outline"
          onPress={submitRule}
        >
          {editing === null ? m.settings_tools_rules_add() : m.settings_tools_rules_save()}
        </Button>
      </View>
      {rules.length > 0 ? (
        <ItemGroup>
          {rules.map((rule, index) => (
            <Item key={`${rule.when}-${index}`} size="sm">
              <ItemContent>
                <ItemTitle numberOfLines={1}>{rule.when}</ItemTitle>
              </ItemContent>
              <ItemValue>{SETTINGS_TOOLS_RULE_BEHAVIOR[rule.behavior]()}</ItemValue>
              <Button
                accessibilityLabel={m.settings_tools_rules_edit()}
                size="icon-sm"
                variant="ghost"
                onPress={() => {
                  setDraft(rule);
                  setEditing(index);
                }}
              >
                <Icon icon={Pencil} size="sm" />
              </Button>
              <Button
                accessibilityLabel={m.settings_tools_rules_delete()}
                size="icon-sm"
                variant="ghost"
                onPress={() => {
                  setRules(rules.filter((_, at) => at !== index));
                  setEditing(null);
                }}
              >
                <Icon icon={Trash2} size="sm" />
              </Button>
            </Item>
          ))}
        </ItemGroup>
      ) : null}
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1">
          <Text variant="label">{m.settings_tools_timeout()}</Text>
          <LabelDescription>{m.settings_tools_timeout_hint()}</LabelDescription>
        </View>
        <Menu
          items={TOOL_APPROVAL.timeoutMinutes.map((minutes) => ({
            label: m.settings_tools_timeout_minutes({ count: minutes }),
            systemImage: minutes === approvalTimeoutMinutes ? 'checkmark' : undefined,
            onSelect: () => setApprovalTimeoutMinutes(minutes),
          }))}
          title={m.settings_tools_timeout()}
        >
          <Button size="sm" variant="outline">{m.settings_tools_timeout_minutes({ count: approvalTimeoutMinutes })}</Button>
        </Menu>
      </View>
      <Text variant="label">{m.settings_tools_jev()}</Text>
      <Input
        secureTextEntry
        accessibilityLabel={m.settings_tools_jev()}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!tools.isPending}
        placeholder={settings.isJevConfigured ? m.settings_secret_saved() : m.settings_tools_jev_placeholder()}
        value={jevApiKey}
        onChangeText={setJevApiKey}
      />
      {tools.problem ? <LabelDescription accessibilityRole="alert" variant="error">{tools.problem}</LabelDescription> : null}
      <Button
        loading={tools.isPending}
        size="sm"
        onPress={() => tools.save({
          approvalRules: rules,
          approvalTimeoutMinutes,
          jevApiKey,
        })}
      >
        {m.settings_save()}
      </Button>
    </View>
  );
}
