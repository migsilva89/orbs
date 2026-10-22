import { m } from '@repo/i18n/client';
import { ScrollView } from 'react-native';
import { Markdown } from '@/components/ui/markdown';
import { useChatReturn } from '@/hooks/use-chat-return';

interface ChatMessageTextProps {
  botId: string;
  entryId: number;
  text: string;
}

export function ChatMessageText({ botId, entryId, text }: ChatMessageTextProps) {
  const returnToChat = useChatReturn();

  return (
    <ScrollView contentContainerClassName="px-6 pt-10 pb-12">
      <Markdown
        selectable
        menuItems={[{
          text: m.rooms_chat_quote(),
          icon: 'text.quote',
          onPress: (selection) => returnToChat({
            botId,
            quote: selection.text,
            quoteEntryId: String(entryId),
          }),
        }]}
      >
        {text}
      </Markdown>
    </ScrollView>
  );
}
