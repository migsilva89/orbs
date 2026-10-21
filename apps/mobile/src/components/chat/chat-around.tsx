import { useChatAround } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { useEffect } from 'react';
import { View } from 'react-native';
import { MessageList } from '@/components/ui/message-list';
import { Text } from '@/components/ui/text';
import type { ChatMessage } from '@openbots/client/client';
import type { Bot, ConversationReaction, ConversationView } from '@openbots/contracts/universal';
import type { ReactElement } from 'react';
import type { SharedValue } from 'react-native-reanimated';

interface ChatAroundProps {
  bot: Bot;
  bots: Bot[];
  view: ConversationView;
  entryId: number;
  composerInset: SharedValue<number>;
  renderMessage: (message: ChatMessage, shown: ChatMessage[], reactions: Map<number, ConversationReaction>) => ReactElement;
  onLatest: () => void;
}

export function ChatAround({ bot, bots, view, entryId, composerInset, renderMessage, onLatest }: ChatAroundProps) {
  const around = useChatAround({
    bot,
    bots,
    view,
    entryId,
  });

  const { isLatest } = around;
  const index = around.messages.findIndex((message) => message.metadata?.entryIds.includes(entryId));

  useEffect(() => {
    if (isLatest) {
      onLatest();
    }
  }, [isLatest, onLatest]);

  if (!around.isReady) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text tone="muted">{m.mobile_chat_loading()}</Text>
      </View>
    );
  }

  return (
    <MessageList
      composerInset={composerInset}
      data={around.messages}
      initialScrollIndex={Math.max(index, 0)}
      keyExtractor={(message) => message.id}
      renderItem={(message) => renderMessage(message, around.messages, around.reactions)}
      onEndReached={() => {
        if (around.newer.isEnabled && !around.newer.isLoading) {
          around.newer.onLoad();
        }
      }}
      onStartReached={() => {
        if (around.older.isEnabled && !around.older.isLoading) {
          around.older.onLoad();
        }
      }}
    />
  );
}
