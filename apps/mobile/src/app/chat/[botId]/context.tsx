import { useLocalSearchParams } from 'expo-router';
import { ChatContextSheet } from '@/components/chat/chat-context-sheet';
import type { ChatContextRouteParams } from '@/types/chat.types';

export default function ChatContextRoute() {
  const { botId, conversationId } = useLocalSearchParams<ChatContextRouteParams>();

  return <ChatContextSheet botId={botId} conversationId={Number(conversationId)} />;
}
