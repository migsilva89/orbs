import { ScrollView } from 'react-native';
import { Markdown } from '@/components/ui/markdown';
import type { ChatTextRouteParams } from '@/types/chat.types';

interface ChatMessageTextProps {
  route: { params: ChatTextRouteParams };
}

export function ChatMessageText({ route }: ChatMessageTextProps) {
  return (
    <ScrollView contentContainerClassName="px-6 pt-10 pb-12">
      <Markdown selectable>{route.params.text}</Markdown>
    </ScrollView>
  );
}
