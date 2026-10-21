import { m } from '@openbots/i18n/client';
import { useRouter } from 'expo-router';
import { Code } from 'lucide-react-native';
import { HtmlFrame } from '@/components/ui/html-frame';
import { PreviewCard } from '@/components/ui/preview-card';

interface ChatHtmlProps {
  botId: string;
  html: string;
}

export function ChatHtml({ botId, html }: ChatHtmlProps) {
  const router = useRouter();
  const title = m.ui_html_preview();

  return (
    <PreviewCard
      icon={Code}
      title={title}
      onExpand={() => router.push({ pathname: '/chat/[botId]/html', params: { botId, html } })}
    >
      <HtmlFrame html={html} title={title} />
    </PreviewCard>
  );
}
