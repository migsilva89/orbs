import { m } from '@repo/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { match } from 'ts-pattern';
import { emojiListOptions, emojiSearch } from '@/services/emoji/emoji.client';
import { EMOJI } from '@/services/emoji/emoji.constants';
import { ActionSheetChoice } from './action-sheet';
import { SearchField } from './search-field';
import { Text } from './text';

interface EmojiGridProps {
  /** The accessibility label of one emoji choice. */
  label: (emoji: string) => string;
  selected?: string[];
  disabled?: boolean;
  onPick: (emoji: string) => void;
}

export function EmojiGrid({ label, selected = [], disabled = false, onPick }: EmojiGridProps) {
  const [search, setSearch] = useState('');
  const emoji = useQuery(emojiListOptions());
  const items = emojiSearch({ items: emoji.data ?? [], query: search });

  const empty = match(emoji.status)
    .with('pending', () => m.rooms_reaction_loading())
    .with('error', () => m.rooms_reaction_load_failed())
    .otherwise(() => m.rooms_reaction_empty());

  return (
    <View className="flex-1 gap-3 px-4 pt-6">
      <SearchField
        accessibilityLabel={m.rooms_reaction_search()}
        placeholder={m.rooms_reaction_search()}
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        columnWrapperClassName="justify-between"
        contentContainerClassName="gap-3 pb-10"
        data={items}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.unicode}
        ListEmptyComponent={<Text className="mt-8 text-center" tone="muted">{empty}</Text>}
        numColumns={EMOJI.columns}
        renderItem={({ item }) => (
          <ActionSheetChoice
            accessibilityLabel={label(item.unicode)}
            disabled={disabled}
            selected={selected.includes(item.unicode)}
            onPress={() => onPick(item.unicode)}
          >
            {item.unicode}
          </ActionSheetChoice>
        )}
      />
    </View>
  );
}
