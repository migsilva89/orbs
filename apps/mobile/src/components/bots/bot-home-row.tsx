import { m } from '@repo/i18n/client';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { match, P } from 'ts-pattern';
import { BotActionsMenu } from '@/components/bots/bot-actions-menu';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import { Text } from '@/components/ui/text';
import { botHomeTime } from '@/services/bot/bot-home.utils';
import type { ConversationListItem } from '@repo/contracts/universal';

interface BotHomeRowProps {
  chat: ConversationListItem;
}

export function BotHomeRow({ chat }: BotHomeRowProps) {
  const router = useRouter();

  return (
    <View className="py-4">
      <BotActionsMenu
        isFullWidth
        botId={chat.botId}
        mode="longPress"
      >
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/chat/[botId]', params: { botId: chat.botId } })}>
          <Item size="row">
            <Avatar avatar={chat.avatar} name={chat.name} />
            <ItemContent>
              <View className="flex-row items-center justify-between gap-2">
                <ItemTitle className="shrink" numberOfLines={1}>{chat.name}</ItemTitle>
                {match(chat.lastMessage)
                  .with(P.nonNullable, (message) => <Text tone="muted" variant="conversation-time">{botHomeTime(message.createdAt)}</Text>)
                  .with(null, () => null)
                  .exhaustive()}
              </View>
              <View className="flex-row items-center gap-2">
                <ItemDescription className="flex-1" numberOfLines={1}>{chat.lastMessage?.preview ?? m.rooms_last_activity_none()}</ItemDescription>
                {chat.hasUnread ? <Badge accessibilityLabel={m.rooms_unread()} variant="unread" /> : null}
              </View>
            </ItemContent>
          </Item>
        </Pressable>
      </BotActionsMenu>
    </View>
  );
}
