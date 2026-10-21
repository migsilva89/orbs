import { useLocalSearchParams } from 'expo-router';
import { ChatReactionPicker } from '@/components/chat/chat-reaction-picker';
import type { ChatReactionRouteParams } from '@/types/chat.types';

export default function ChatReactRoute() {
  const { botId, conversationId, entryId } = useLocalSearchParams<ChatReactionRouteParams>();

  return (
    <ChatReactionPicker
      botId={botId}
      conversationId={Number(conversationId)}
      entryId={Number(entryId)}
    />
  );
}
