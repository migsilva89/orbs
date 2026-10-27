import { htmlDocument } from '@repo/client/client';
import { htmlFrameMessage } from '@repo/contracts/universal';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { match } from 'ts-pattern';
import { useTheme } from '@/hooks/use-theme';
import { htmlFrameFonts } from '@/services/html/html.client';
import { THEME_CONFIG } from '@/services/theme/theme.constants';

interface HtmlFrameProps {
  html: string
  title: string
}

export function HtmlFrame({ html, title }: HtmlFrameProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(320);
  const theme = useTheme();
  const { data: fonts } = useQuery(htmlFrameFonts);
  const document = htmlDocument(html);

  const postTheme = () => {
    const styles = getComputedStyle(window.document.documentElement);
    frame.current?.contentWindow?.postMessage({
      type: 'bots.html-theme',
      appearance: theme.resolved,
      tokens: Object.fromEntries(THEME_CONFIG.tokens.map((token) => [token, styles.getPropertyValue(token)])),
      fonts: fonts ?? [],
    }, '*');
  };

  useEffect(postTheme, [theme.resolved, theme.selected, theme.themes, fonts]);

  useLayoutEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) {
        return;
      }

      const message = htmlFrameMessage.safeParse(event.data);

      if (!message.success) {
        return;
      }
      match(message.data)
        .with({ type: 'bots.html-height' }, ({ height: contentHeight }) => setHeight(Math.max(80, Math.min(1600, contentHeight))))
        .with({ type: 'bots.html-link' }, ({ url }) => {
          if (window.document.activeElement === frame.current && navigator.userActivation.isActive) {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        })
        .exhaustive();
    };

    window.addEventListener('message', onMessage);

    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <iframe
      className="block w-full border-0"
      ref={frame}
      referrerPolicy="no-referrer"
      sandbox="allow-scripts"
      srcDoc={document}
      style={{ height, colorScheme: theme.resolved }}
      title={title}
      onLoad={postTheme}
    />
  );
}
