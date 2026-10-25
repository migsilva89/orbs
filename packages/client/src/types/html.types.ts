export interface HtmlReplySegment {
  kind: 'markdown' | 'html';
  text: string;
}

export type HtmlBridgeMessage =
  | { type: 'bots.html-height'; height: number }
  | { type: 'bots.html-link'; url: string };

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}
