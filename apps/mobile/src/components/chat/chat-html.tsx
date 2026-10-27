import { htmlEmoji, htmlTitle } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { useRouter } from 'expo-router';
import { HtmlFrame } from '@/components/ui/html-frame';
import { PreviewCard } from '@/components/ui/preview-card';

interface ChatHtmlProps {
  botId: string;
  html: string;
}

export function ChatHtml({ botId, html }: ChatHtmlProps) {
  const router = useRouter();
  const title = htmlTitle(html) ?? m.ui_html_preview();

  return (
    <PreviewCard
      content="page"
      emoji={htmlEmoji(html)}
      kind={m.ui_html_page()}
      label={m.artifacts_expand()}
      title={title}
      onOpen={() => router.push({ pathname: '/chat/[botId]/html', params: { botId, html } })}
    >
      <HtmlFrame html={html} title={title} />
    </PreviewCard>
  );
}
