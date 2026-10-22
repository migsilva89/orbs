import { htmlDocument } from '@repo/client/client';
import { htmlFrameMessageText } from '@repo/contracts/universal';
import { useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { match } from 'ts-pattern';
import { useCSSVariable, useUniwind } from 'uniwind';
import type { WebViewMessageEvent } from 'react-native-webview';

// The colour tokens a page can use, as on web. Mobile has no sidebar or chart colours.
const HTML_FRAME_TOKENS = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--destructive',
  '--destructive-foreground',
  '--border',
  '--input',
  '--ring',
  '--success',
  '--success-foreground',
  '--warning',
  '--warning-foreground',
  '--skill',
] as const;

// Matches --radius in apps/web/src/application/styles.css.
const HTML_FRAME_RADIUS = '0.625rem';

const HTML_FRAME_HEIGHT = { initial: 320, min: 80, max: 1600 };

interface HtmlFrameProps {
  html: string;
  title: string;
  /** Fill the parent and scroll, instead of growing to the page height. */
  fill?: boolean;
  /** Keep the page clear of a see-through navigation header. */
  isUnderHeader?: boolean;
}

/** A model-written HTML page, sandboxed, themed like the app and sized to its content. */
export function HtmlFrame({ html, title, fill = false, isUnderHeader = false }: HtmlFrameProps) {
  const view = useRef<WebView<object>>(null);
  const [height, setHeight] = useState(HTML_FRAME_HEIGHT.initial);
  const { theme } = useUniwind();
  const values = useCSSVariable(HTML_FRAME_TOKENS.map((token) => `--color-${token.slice(2)}`)).map(String);
  const tokens = { ...Object.fromEntries(HTML_FRAME_TOKENS.map((token, index) => [token, values[index]])), '--radius': HTML_FRAME_RADIUS };

  // Applied straight to the page before first paint; a posted message from native does not pass the page's source check.
  const themeScript = `(function (appearance, tokens) {
    var root = document.documentElement;
    root.style.colorScheme = appearance;
    root.classList.toggle('dark', appearance === 'dark');
    Object.keys(tokens).forEach(function (name) { root.style.setProperty(name, tokens[name]); });
  })(${JSON.stringify(theme)}, ${JSON.stringify(tokens)}); true;`;

  useEffect(() => {
    view.current?.injectJavaScript(themeScript);
  }, [themeScript]);

  function handleMessage(event: WebViewMessageEvent) {
    const message = htmlFrameMessageText.safeParse(event.nativeEvent.data);

    if (message.success) {
      match(message.data)
        .with({ type: 'bots.html-height' }, ({ height: content }) => setHeight(Math.max(HTML_FRAME_HEIGHT.min, Math.min(HTML_FRAME_HEIGHT.max, content))))
        .with({ type: 'bots.html-link' }, ({ url }) => void Linking.openURL(url))
        .exhaustive();
    }
  }

  return (
    <WebView<object>
      accessibilityLabel={title}
      bounces={false}
      containerStyle={fill ? undefined : { flex: 0, height }}
      contentInsetAdjustmentBehavior={isUnderHeader ? 'automatic' : 'never'}
      injectedJavaScriptBeforeContentLoaded={themeScript}
      originWhitelist={['about:blank']}
      ref={view}
      scrollEnabled={fill}
      source={{ html: htmlDocument(html) }}
      style={fill ? { flex: 1, backgroundColor: 'transparent' } : { height, backgroundColor: 'transparent' }}
      onMessage={handleMessage}
      onShouldStartLoadWithRequest={(request) => request.url === 'about:blank'}
    />
  );
}
