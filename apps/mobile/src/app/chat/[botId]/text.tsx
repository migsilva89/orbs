import { useLocalSearchParams } from 'expo-router';
import { ChatMessageText } from '@/components/chat/chat-message-text';
import type { ChatTextRouteParams } from '@/types/chat.types';

export default function ChatTextRoute() {
  const { botId, entryId, text } = useLocalSearchParams<ChatTextRouteParams>();

  return (
    <ChatMessageText
      botId={botId}
      entryId={Number(entryId)}
      text={text}
    />
  );
}
