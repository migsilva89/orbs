import { mentionQuote } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { useNavigation } from '@react-navigation/native';
import { ScrollView } from 'react-native';
import { Markdown } from '@/components/ui/markdown';
import type { ChatTextRouteParams } from '@/types/chat.types';
import type { NavigationRoot } from '@/types/navigation.types';

interface ChatMessageTextProps {
  route: { params: ChatTextRouteParams };
}

export function ChatMessageText({ route }: ChatMessageTextProps) {
  const navigation = useNavigation<NavigationRoot>();
  const { text, botId, entryId } = route.params;

  return (
    <ScrollView contentContainerClassName="px-6 pt-10 pb-12">
      <Markdown
        selectable
        menuItems={[{
          text: m.rooms_chat_quote(),
          icon: 'text.quote',
          onPress: (selection) => navigation.popTo('Chat', { botId, quote: mentionQuote({ text: selection.text, entryId }) }, { merge: true }),
        }]}
      >
        {text}
      </Markdown>
    </ScrollView>
  );
}
