import { useEffect, useRef, useState } from 'react';
import { ROOMS } from '../services/rooms/rooms.constants';
import type { RoomsQuoteSelection } from '../types/rooms.types';

export function useChatQuote() {
  const [selection, setSelection] = useState<RoomsQuoteSelection | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function quoteBubble(node: Node | null): HTMLElement | null {
      const element = node instanceof HTMLElement ? node : node?.parentElement;

      return element?.closest<HTMLElement>('[data-quote-id]') ?? null;
    }

    function readSelection() {
      const picked = document.getSelection();
      const text = picked?.toString().trim() ?? '';
      const bubble = quoteBubble(picked?.anchorNode ?? null);

      if (!picked || picked.isCollapsed || text === '' || !bubble || bubble !== quoteBubble(picked.focusNode)) {
        return null;
      }

      return { messageId: bubble.dataset.quoteId ?? '', text, rect: picked.getRangeAt(0).getBoundingClientRect() };
    }

    function quoteChange() {
      clearTimeout(timer.current);
      setSelection(null);
      const picked = readSelection();

      if (picked) {
        timer.current = setTimeout(() => setSelection(picked), ROOMS.quoteDelayMs);
      }
    }

    document.addEventListener('selectionchange', quoteChange);

    return () => {
      clearTimeout(timer.current);
      document.removeEventListener('selectionchange', quoteChange);
    };
  }, []);

  return {
    selection,
    dismiss: () => {
      clearTimeout(timer.current);
      setSelection(null);
    },
  };
}
