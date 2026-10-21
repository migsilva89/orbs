import { useLocalSearchParams } from 'expo-router';
import { ChatPair } from '@/components/chat/chat-pair';
import type { ChatPairRouteParams } from '@/types/chat.types';

export default function ChatPairRoute() {
  const { botId, peerId, conversationId } = useLocalSearchParams<ChatPairRouteParams>();

  return (
    <ChatPair
      botId={botId}
      conversationId={Number(conversationId)}
      peerId={peerId}
    />
  );
}
