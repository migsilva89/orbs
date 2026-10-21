import { useChatMessageReaction } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { match, P } from 'ts-pattern';
import { ActionSheetChoice } from '@/components/ui/action-sheet';
import { SearchField } from '@/components/ui/search-field';
import { Text } from '@/components/ui/text';
import { useConnection } from '@/hooks/use-connection';
import { emojiListOptions, emojiSearch } from '@/services/emoji/emoji.client';
import { EMOJI } from '@/services/emoji/emoji.constants';
import type { ChatMessageReactionParams } from '@openbots/client/client';

interface ChatReactionPickerProps {
  botId: string;
  conversationId: number;
  entryId: number;
}

export function ChatReactionPicker(params: ChatReactionPickerProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, () => <ChatReactionPickerContent params={params} />)
    .otherwise(() => null);
}

interface ChatReactionPickerContentProps {
  params: ChatMessageReactionParams;
}

function ChatReactionPickerContent({ params }: ChatReactionPickerContentProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const emoji = useQuery(emojiListOptions());
  const reaction = useChatMessageReaction(params);
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
            accessibilityLabel={m.rooms_reaction_quick({ emoji: item.unicode })}
            disabled={reaction.isPending}
            selected={reaction.mine.includes(item.unicode)}
            onPress={() => {
              reaction.react(item.unicode);
              router.back();
            }}
          >
            {item.unicode}
          </ActionSheetChoice>
        )}
      />
    </View>
  );
}
