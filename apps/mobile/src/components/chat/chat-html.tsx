import { m } from '@openbots/i18n/client';
import { Code } from 'lucide-react-native';
import { HtmlFrame } from '@/components/ui/html-frame';
import { PreviewCard } from '@/components/ui/preview-card';

interface ChatHtmlProps {
  html: string;
}

export function ChatHtml({ html }: ChatHtmlProps) {
  const title = m.ui_html_preview();

  const expanded = (
    <HtmlFrame
      fill
      html={html}
      title={title}
    />
  );

  return (
    <PreviewCard
      expanded={expanded}
      icon={Code}
      title={title}
    >
      <HtmlFrame html={html} title={title} />
    </PreviewCard>
  );
}
