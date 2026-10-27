import { Errors } from '@repo/errors/universal';
import { useEffect, useRef, useState } from 'react';
import { CLIPBOARD } from '../services/clipboard/clipboard.constants';

export function useClipboardCopy() {
  const [isCopied, setIsCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy(text: string): Promise<void> {
    await clipboardWrite(text);
    setIsCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setIsCopied(false), CLIPBOARD.copiedMs);
  }

  return { copy, isCopied };
}

async function clipboardWrite(text: string): Promise<void> {
  if (window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const focused = document.activeElement;
  const input = document.createElement('textarea');
  input.value = text;
  input.readOnly = true;
  input.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
  (focused?.closest('[role="dialog"]') ?? document.body).append(input);

  try {
    input.focus({ preventScroll: true });
    input.select();

    if (!document.execCommand('copy')) {
      throw new Errors.INTERNAL_ERROR({ internal: 'Browser rejected clipboard copy' });
    }
  } finally {
    input.remove();

    if (focused instanceof HTMLElement) {
      focused.focus({ preventScroll: true });
    }
  }
}
