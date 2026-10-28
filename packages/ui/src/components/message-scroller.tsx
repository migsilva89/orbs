import { Errors } from '@repo/errors/universal';
import { m } from '@repo/i18n/client';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import { cva } from 'cva';
import { createContext, use, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import IconLucideArrowDown from '~icons/lucide/arrow-down';
import { cn } from '../lib/cn';
import { Button } from './button';
import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import type { VariantProps } from 'cva';
import type * as ReactTypes from 'react';

export interface MessageScrollerRow {
  key: string
  node: ReactTypes.ReactNode
}

interface MessageScrollerScrollable {
  start: boolean
  end: boolean
}

interface MessageScrollerScrollOptions {
  behavior?: 'auto' | 'smooth'
  align?: 'start' | 'center' | 'end'
}

interface MessageScrollerPosition {
  key: string | null
  offset: number
  measurements: VirtualItem[]
}

interface MessageScrollerState {
  virtualizer: ReactTypes.RefObject<Virtualizer<HTMLElement, Element> | null>
  keys: ReactTypes.RefObject<string[]>
  scrollable: MessageScrollerScrollable
  setScrollable: (scrollable: MessageScrollerScrollable) => void
}

const MESSAGE_SCROLLER = {
  estimateSize: 120,
  overscan: 6,
  endThreshold: 8,
  padding: { end: { start: 16, end: 16 }, both: { start: 64, end: 16 } },
} as const;

const messageScrollerPositions = new Map<string, MessageScrollerPosition>();

function messageScrollerAnchor(positionKey: string): string | null {
  return messageScrollerPositions.get(positionKey)?.key ?? null;
}

const MessageScrollerContext = createContext<MessageScrollerState | null>(null);

function useMessageScrollerState(): MessageScrollerState {
  const state = use(MessageScrollerContext);

  if (!state) {
    throw new Errors.INTERNAL_ERROR({ internal: 'Message scroller parts require MessageScrollerProvider' });
  }

  return state;
}

function MessageScrollerProvider({ children }: { children: ReactTypes.ReactNode }) {
  const virtualizer = useRef<Virtualizer<HTMLElement, Element>>(null);
  const keys = useRef<string[]>([]);
  const [scrollable, setScrollable] = useState<MessageScrollerScrollable>({ start: false, end: false });

  return <MessageScrollerContext value={{ virtualizer, keys, scrollable, setScrollable }}>{children}</MessageScrollerContext>;
}

function useMessageScroller() {
  const { virtualizer, keys } = useMessageScrollerState();

  return {
    scrollToEnd: ({ behavior = 'auto' }: MessageScrollerScrollOptions = {}) => virtualizer.current?.scrollToEnd({ behavior }),
    scrollToMessage: (key: string, { behavior = 'auto', align = 'center' }: MessageScrollerScrollOptions = {}) => {
      const index = keys.current.indexOf(key);

      if (index !== -1) {
        virtualizer.current?.scrollToIndex(index, { align, behavior });
      }
    },
  };
}

function useMessageScrollerScrollable(): MessageScrollerScrollable {
  return useMessageScrollerState().scrollable;
}

function MessageScroller({ className, ...props }: ReactTypes.ComponentProps<'div'>) {
  return (
    <div
      className={cn('group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden', className)}
      data-slot="message-scroller"
      {...props}
    />
  );
}

const messageScrollerViewportVariants = cva({
  base: 'scrollbar size-full min-h-0 min-w-0 scrollbar-gutter-stable overflow-y-auto overscroll-contain outline-hidden [--scrollbar-thumb:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] [--scrollbar-track:transparent] [overflow-anchor:none] scrollbar-h-1 scrollbar-thumb-rounded-full scrollbar-w-1 data-pending-scroll:invisible',
  variants: {
    fade: {
      end: 'scroll-fade-b',
      both: 'scroll-fade-y scroll-fade-b-2 scroll-fade-t-10',
    },
  },
  defaultVariants: { fade: 'end' },
});

function MessageScrollerViewport({
  rows,
  header,
  focusKey,
  positionKey,
  fade = 'end',
  endInset = 0,
  className,
  rowClassName,
  style,
  ...props
}: Omit<ReactTypes.ComponentProps<'section'>, 'children'> & VariantProps<typeof messageScrollerViewportVariants> & {
  rows: MessageScrollerRow[]
  header?: ReactTypes.ReactNode
  focusKey?: string
  positionKey?: string
  rowClassName?: string
  endInset?: number
}) {
  const state = useMessageScrollerState();
  const viewport = useRef<HTMLElement>(null);
  const [saved] = useState(() => (positionKey ? messageScrollerPositions.get(positionKey) : undefined));
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const place = useRef<{ key: string | null, offset: number }>({ key: null, offset: 0 });
  const pinned = useRef(true);
  const padding = MESSAGE_SCROLLER.padding[fade];
  const viewportStyle: ReactTypes.CSSProperties & { '--scroll-fade-b-size'?: string } = { ...style, '--scroll-fade-b-size': endInset ? `${endInset}px` : undefined };
  const keys = rows.map((row) => row.key);

  // oxlint-disable-next-line react/incompatible-library -- TanStack Virtual returns live methods; the compiler already skips this component
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => viewport.current,
    estimateSize: () => MESSAGE_SCROLLER.estimateSize,
    getItemKey: (index) => keys[index] ?? index,
    initialMeasurementsCache: saved?.measurements,
    anchorTo: 'end',
    followOnAppend: true,
    scrollEndThreshold: MESSAGE_SCROLLER.endThreshold,
    overscan: MESSAGE_SCROLLER.overscan,
    paddingStart: padding.start,
    paddingEnd: padding.end + endInset,
    rangeExtractor: (range) => {
      const indexes = defaultRangeExtractor(range);

      if (!selected) {
        return indexes;
      }

      const kept = Array.from({ length: selected[1] - selected[0] + 1 }, (_, offset) => selected[0] + offset);

      return [...new Set([...indexes, ...kept])].sort((first, second) => first - second);
    },
    onChange: (instance) => {
      const next = { start: (instance.scrollOffset ?? 0) > MESSAGE_SCROLLER.endThreshold, end: !instance.isAtEnd() };

      if (next.start !== state.scrollable.start || next.end !== state.scrollable.end) {
        state.setScrollable(next);
      }
    },
  });

  const focus = (key: string | undefined) => {
    const index = key ? keys.indexOf(key) : -1;

    if (index !== -1) {
      virtualizer.scrollToIndex(index, { align: 'center' });
    }

    return index !== -1;
  };

  const open = useEffectEvent(() => {
    const savedRow = saved?.key ? virtualizer.measurementsCache[keys.indexOf(saved.key)] : undefined;

    if (focus(focusKey)) {
      return;
    }

    if (savedRow && saved) {
      virtualizer.scrollToOffset(savedRow.start + saved.offset);
    } else {
      virtualizer.scrollToEnd();
    }
  });

  const track = (element: HTMLElement) => {
    const top = virtualizer.getVirtualItemForOffset(element.scrollTop);

    pinned.current = element.scrollHeight - element.scrollTop - element.clientHeight <= MESSAGE_SCROLLER.endThreshold;
    place.current = !pinned.current && top ? { key: String(top.key), offset: element.scrollTop - top.start } : { key: null, offset: 0 };
  };

  const remember = useEffectEvent(() => {
    if (positionKey) {
      messageScrollerPositions.set(positionKey, { ...place.current, measurements: virtualizer.takeSnapshot() });
    }
  });

  const follow = useEffectEvent(() => {
    if (ready && pinned.current) {
      virtualizer.scrollToEnd();
    }
  });

  const select = useEffectEvent(() => {
    const selection = document.getSelection();

    const rowIndex = (node: Node | null | undefined) => {
      const row = (node instanceof Element ? node : node?.parentElement)?.closest('[data-index]');

      return row && viewport.current?.contains(row) ? Number(row.getAttribute('data-index')) : undefined;
    };

    const start = selection && !selection.isCollapsed ? rowIndex(selection.anchorNode) : undefined;
    const end = selection && !selection.isCollapsed ? rowIndex(selection.focusNode) : undefined;
    const next: [number, number] | null = start === undefined || end === undefined ? null : [Math.min(start, end), Math.max(start, end)];

    if (next?.[0] !== selected?.[0] || next?.[1] !== selected?.[1]) {
      setSelected(next);
    }
  });

  const refocus = useEffectEvent((key: string | undefined) => {
    if (ready) {
      focus(key);
    }
  });

  useLayoutEffect(() => {
    state.virtualizer.current = virtualizer;
    state.keys.current = keys;
  });

  useLayoutEffect(() => {
    open();

    const frame = requestAnimationFrame(() => flushSync(() => setReady(true)));

    return () => {
      cancelAnimationFrame(frame);
      remember();
    };
  }, []);

  useEffect(() => {
    refocus(focusKey);
  }, [focusKey]);

  useLayoutEffect(() => {
    follow();
  }, [rows.length, endInset]);

  useEffect(() => {
    document.addEventListener('selectionchange', select);

    return () => document.removeEventListener('selectionchange', select);
  }, []);

  return (
    <section
      className={cn(messageScrollerViewportVariants({ fade }), className)}
      data-pending-scroll={ready ? undefined : ''}
      data-slot="message-scroller-viewport"
      ref={viewport}
      style={viewportStyle}
      onScroll={(event) => track(event.currentTarget)}
      {...props}
    >
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {header ? <div className={cn('absolute inset-x-0 top-0 mx-auto w-full px-4', rowClassName)}>{header}</div> : null}
        {virtualizer.getVirtualItems().map((item) => (
          <div
            className={cn('absolute inset-x-0 top-0 mx-auto w-full px-4', rowClassName)}
            data-index={item.index}
            key={item.key}
            ref={virtualizer.measureElement}
            style={{ transform: `translateY(${item.start}px)` }}
          >
            {rows[item.index]?.node}
          </div>
        ))}
      </div>
    </section>
  );
}

const messageScrollerItemVariants = cva({
  base: 'min-w-0',
  variants: {
    variant: {
      default: '',
      highlight: 'animate-highlight rounded-3xl motion-reduce:animate-none',
    },
  },
  defaultVariants: { variant: 'default' },
});

function MessageScrollerItem({ className, variant, ...props }: ReactTypes.ComponentProps<'div'> & VariantProps<typeof messageScrollerItemVariants>) {
  return <div className={cn(messageScrollerItemVariants({ variant }), className)} data-slot="message-scroller-item" {...props} />;
}

function MessageScrollerButton({
  className,
  variant = 'outline',
  size = 'icon-sm',
  ...props
}: ReactTypes.ComponentProps<typeof Button>) {
  const { end } = useMessageScrollerScrollable();
  const scroller = useMessageScroller();

  return (
    <Button
      className={cn(
        'absolute inset-s-1/2 bottom-4 -translate-x-1/2 rounded-full bg-background shadow-sm transition-[translate,scale,opacity] duration-200 dark:bg-[color-mix(in_oklab,var(--input)_30%,var(--background))]',
        'data-[active=false]:pointer-events-none data-[active=false]:translate-y-full data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[active=false]:duration-400 data-[active=false]:ease-[cubic-bezier(0.7,0,0.84,0)]',
        'data-[active=true]:translate-y-0 data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[active=true]:ease-[cubic-bezier(0.23,1,0.32,1)] rtl:translate-x-1/2',
        'group-has-[[data-pending-scroll]]/message-scroller:invisible group-has-[[data-pending-scroll]]/message-scroller:opacity-0! group-has-[[data-pending-scroll]]/message-scroller:transition-none!',
        className,
      )}
      data-active={end}
      data-slot="message-scroller-button"
      inert={!end}
      size={size}
      tabIndex={end ? undefined : -1}
      variant={variant}
      onClick={() => scroller.scrollToEnd({ behavior: 'smooth' })}
      {...props}
    >
      <IconLucideArrowDown />
      <span className="sr-only">{m.ui_scroll_end()}</span>
    </Button>
  );
}

export {
  messageScrollerAnchor,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerScrollable,
};
