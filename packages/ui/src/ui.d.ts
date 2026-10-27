declare module '*.css';

interface Window {
  ReactNativeWebView?: { postMessage: (message: string) => void };
}
