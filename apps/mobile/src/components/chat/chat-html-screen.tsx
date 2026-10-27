import { htmlEmoji, htmlTitle } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { View } from 'react-native';
import { HtmlFrame } from '@/components/ui/html-frame';
import { Screen } from '@/components/ui/screen';
import { CHAT_PANE } from '@/services/chat/chat.constants';
import { ChatPaneClose, ChatPaneHeader, ChatPaneTitle } from './chat-pane';

interface ChatHtmlScreenProps {
  html: string;
}

export function ChatHtmlScreen({ html }: ChatHtmlScreenProps) {
  const title = htmlTitle(html) ?? m.ui_html_preview();

  return (
    <Screen padding="none" scroll={false}>
      <View className="flex-1 px-4">
        <HtmlFrame
          fill
          html={html}
          inset={{ top: CHAT_PANE.barHeight, bottom: CHAT_PANE.barHeight }}
          title={title}
        />
      </View>
      <ChatPaneHeader>
        <ChatPaneTitle>{`${htmlEmoji(html)} ${title}`}</ChatPaneTitle>
      </ChatPaneHeader>
      <ChatPaneClose />
    </Screen>
  );
}
