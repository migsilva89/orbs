import { useLocalSearchParams } from 'expo-router';
import { ChatResetDialog } from '@/components/chat/chat-reset-dialog';
import type { ChatResetRouteParams } from '@/types/chat.types';

export default function ChatResetRoute() {
  const { botId, handoff } = useLocalSearchParams<ChatResetRouteParams>();

  return <ChatResetDialog botId={botId} handoff={handoff} />;
}
