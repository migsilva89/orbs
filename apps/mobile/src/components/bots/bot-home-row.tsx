import { m } from '@openbots/i18n/client';
import { View } from 'react-native';
import { match, P } from 'ts-pattern';
import { Avatar } from '@/components/ui/avatar';
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import { Text } from '@/components/ui/text';
import { botHomeTime } from '@/services/bot/bot-home.utils';
import type { ConversationListItem } from '@openbots/contracts/universal';

interface BotHomeRowProps {
  chat: ConversationListItem;
}

export function BotHomeRow({ chat }: BotHomeRowProps) {
  return (
    <Item size="chat">
      <Avatar avatar={chat.avatar} name={chat.name} />
      <ItemContent>
        <View className="flex-row items-center justify-between gap-2">
          <ItemTitle className="shrink" numberOfLines={1}>{chat.name}</ItemTitle>
          {match(chat.lastMessage)
            .with(P.nonNullable, (message) => <Text tone="muted" variant="conversation-time">{botHomeTime(message.createdAt)}</Text>)
            .with(null, () => null)
            .exhaustive()}
        </View>
        <ItemDescription numberOfLines={1}>{chat.lastMessage?.preview ?? m.rooms_last_activity_none()}</ItemDescription>
      </ItemContent>
    </Item>
  );
}
