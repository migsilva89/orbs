import { useLocalSearchParams } from 'expo-router';
import { ChatHtmlScreen } from '@/components/chat/chat-html-screen';
import type { ChatHtmlRouteParams } from '@/types/chat.types';

export default function ChatHtmlRoute() {
  const { html } = useLocalSearchParams<ChatHtmlRouteParams>();

  return <ChatHtmlScreen html={html} />;
}
