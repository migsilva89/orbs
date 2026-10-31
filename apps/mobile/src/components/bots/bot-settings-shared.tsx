import { m } from '@repo/i18n/client';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Switch, View } from 'react-native';
import { match } from 'ts-pattern';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item';
import { LabelDescription } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { botSharedSelected } from '@/services/bot/bot-shared.utils';
import type { BotSharedForm, BotSharedList, BotSharedResource } from '@/types/bot-shared.types';

interface BotSettingsSharedProps {
  resource: BotSharedResource;
  list: BotSharedList;
  isDisabled: boolean;
}

export function BotSettingsShared({ resource, list, isDisabled }: BotSettingsSharedProps) {
  const { field, items, isError, messages } = list;
  const form = useFormContext<BotSharedForm>();
  const [inherit, shared] = useWatch({ control: form.control, name: ['inherit', field] });
  const [search, setSearch] = useState('');

  const sorted = [...(items ?? [])].sort((left, right) => left.name.localeCompare(right.name));
  const names = sorted.map((item) => item.name);

  const selected = botSharedSelected({
    resource,
    names,
    inherit,
    shared,
  });

  const query = search.trim().toLowerCase();
  const visible = sorted.filter((item) => item.keywords.toLowerCase().includes(query));

  function choose(next: Set<string>) {
    const picked = names.filter((name) => next.has(name));
    const without = inherit.filter((item) => item !== resource);

    form.setValue('inherit', picked.length === 0 ? without : [...without, resource], { shouldDirty: true });
    form.setValue(field, picked.length === names.length ? [] : picked, { shouldDirty: true });
  }

  function toggle(name: string, isOn: boolean) {
    const next = new Set(selected);

    match(isOn)
      .with(true, () => next.add(name))
      .with(false, () => next.delete(name))
      .exhaustive();
    choose(next);
  }

  if (isError) {
    return <LabelDescription accessibilityRole="alert" variant="error">{messages.loadFailed}</LabelDescription>;
  }

  if (!items) {
    return <Skeleton className="h-24 rounded-2xl" />;
  }

  if (sorted.length === 0) {
    return messages.empty ? <LabelDescription>{messages.empty}</LabelDescription> : null;
  }

  return (
    <View className="gap-2">
      <Input
        accessibilityLabel={messages.search}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        placeholder={messages.search}
        returnKeyType="search"
        value={search}
        onChangeText={setSearch}
      />
      <View className="flex-row items-center justify-between gap-2 px-3">
        <Text tone="muted" variant="small">{m.bots_pick_selected({ selected: String(selected.size), total: String(names.length) })}</Text>
        <View className="flex-row gap-1">
          <Button
            disabled={isDisabled}
            size="xs"
            variant="ghost"
            onPress={() => choose(new Set(names))}
          >
            {m.bots_pick_all()}
          </Button>
          <Button
            disabled={isDisabled}
            size="xs"
            variant="ghost"
            onPress={() => choose(new Set())}
          >
            {m.bots_pick_none()}
          </Button>
        </View>
      </View>
      <ItemGroup>
        {visible.map((item) => (
          <Item key={item.name}>
            <ItemContent>
              <ItemTitle numberOfLines={1}>{item.name}</ItemTitle>
              {item.detail ? <ItemDescription>{item.detail}</ItemDescription> : null}
            </ItemContent>
            <Switch
              accessibilityLabel={item.name}
              disabled={isDisabled}
              value={selected.has(item.name)}
              onValueChange={(isOn) => toggle(item.name, isOn)}
            />
          </Item>
        ))}
        {visible.length === 0 ? (
          <Item>
            <ItemContent>
              <ItemDescription numberOfLines={0}>{messages.noMatch}</ItemDescription>
            </ItemContent>
          </Item>
        ) : null}
      </ItemGroup>
      <LabelDescription>{messages.note}</LabelDescription>
    </View>
  );
}
