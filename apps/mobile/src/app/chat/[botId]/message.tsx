import { useLocalSearchParams } from 'expo-router';
import { ChatMessageActions } from '@/components/chat/chat-message-actions';
import type { ChatActionsRouteParams } from '@/types/chat.types';

export default function ChatMessageRoute() {
  const { botId, conversationId, entryId, from, text, details } = useLocalSearchParams<ChatActionsRouteParams>();

  return (
    <ChatMessageActions
      botId={botId}
      conversationId={Number(conversationId)}
      details={details ? details.split('\n') : []}
      entryId={Number(entryId)}
      from={from}
      text={text}
    />
  );
}
