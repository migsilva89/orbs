import { roomsSearchSnippet } from '@openbots/client/client';
import { getLocale, m } from '@openbots/i18n/client';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Item, ItemContent } from '@/components/ui/item';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import type { RoomsSearchResults } from '@openbots/client/client';

interface ChatSearchResultsProps {
  results: RoomsSearchResults;
  query: string;
  isPending: boolean;
}

export function ChatSearchResults({ results, query, isPending }: ChatSearchResultsProps) {
  const router = useRouter();

  if (isPending && results.groups.length === 0) {
    return (
      <View className="gap-1 pt-4">
        {[0, 1, 2].map((row) => (
          <Item key={row}>
            <ItemContent>
              <Skeleton size="title" />
              <Skeleton size="description" />
            </ItemContent>
          </Item>
        ))}
      </View>
    );
  }

  return (
    <View className="pt-4">
      {results.groups.map((group) => (
        <View key={group.chat.botId}>
          <Text
            className="mx-5 mt-4 mb-1"
            tone="muted"
            variant="label"
          >
            {group.title}
          </Text>
          {group.hits.map((hit) => (
            <Pressable
              accessibilityRole="button"
              className="active:bg-accent"
              key={hit.entryId}
              onPress={() => router.push({ pathname: '/chat/[botId]', params: { botId: group.chat.botId, entryId: String(hit.entryId) } })}
            >
              <Item>
                <ItemContent>
                  <View className="flex-row items-baseline justify-between gap-2">
                    <Text
                      numberOfLines={1}
                      tone="muted"
                      variant="small"
                    >
                      {hit.role === 'user' ? m.rooms_chat_you() : group.title}
                    </Text>
                    <Text tone="muted" variant="small">{new Date(hit.createdAt).toLocaleDateString(getLocale(), { dateStyle: 'medium' })}</Text>
                  </View>
                  <Text
                    numberOfLines={2}
                    tone="muted"
                    variant="body"
                  >
                    {roomsSearchSnippet({ text: hit.text, query }).map((part) => (part.match
                      ? (
                        <Text
                          key={part.start}
                          tone="default"
                          variant="search-match"
                        >
                          {part.text}
                        </Text>
                      )
                      : part.text))}
                  </Text>
                </ItemContent>
              </Item>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}
