import { useLocalSearchParams } from 'expo-router';
import { ChatSubagentScreen } from '@/components/chat/chat-subagent-screen';
import type { ChatSubagentRouteParams } from '@/types/chat.types';

export default function ChatSubagentRoute() {
  const { botId, conversationId, name, task } = useLocalSearchParams<ChatSubagentRouteParams>();

  return (
    <ChatSubagentScreen
      botId={botId}
      conversationId={Number(conversationId)}
      name={name}
      task={task}
    />
  );
}
