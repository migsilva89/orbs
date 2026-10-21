import { m } from '@openbots/i18n/client';
import { View } from 'react-native';
import { HtmlFrame } from '@/components/ui/html-frame';

interface ChatHtmlScreenProps {
  html: string;
}

export function ChatHtmlScreen({ html }: ChatHtmlScreenProps) {
  return (
    <View className="flex-1 bg-background px-4">
      <HtmlFrame
        fill
        isUnderHeader
        html={html}
        title={m.ui_html_preview()}
      />
    </View>
  );
}
