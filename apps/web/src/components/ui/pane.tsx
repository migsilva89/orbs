import { m } from '@repo/i18n/client';
import { cva } from 'cva';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { createContext, use, useEffect, useEffectEvent, useState } from 'react';
import { cn } from '@/lib/cn';
import X from '~icons/lucide/x';
import { Button } from './button';
import type { VariantProps } from 'cva';
import type { ComponentProps, CSSProperties, ReactNode } from 'react';

// A pane fills its host, a chat or the main column, the way a bot's private chat does: its name in a pill floating at
// the top, a close button beside it, and its content scrolling underneath. The sidebars stay usable while it is open,
// and a host can keep its composer above it.

interface PaneHostState {
  isOpen: boolean
  register: (close: () => void) => () => void
  closeAll: () => void
}

type PaneHostStyle = CSSProperties & { '--pane-inset-bottom'?: string };

const paneHostContext = createContext<(PaneHostState & { element: HTMLDivElement | null }) | null>(null);

/** The state of a pane host, kept by the component that also owns what floats above its panes. */
function usePaneHost(): PaneHostState {
  const [count, setCount] = useState(0);

  const [actions] = useState(() => {
    const closers = new Set<() => void>();

    return {
      register: (close: () => void) => {
        closers.add(close);
        setCount(closers.size);

        return () => {
          closers.delete(close);
          setCount(closers.size);
        };
      },
      closeAll: () => {
        for (const close of closers) {
          close();
        }
      },
    };
  });

  return { ...actions, isOpen: count > 0 };
}

/** Where panes opened inside it fill. `insetBottom` keeps their content clear of a composer floating over them. */
function PaneHost({ host, insetBottom = 0, className, style, ...props }: ComponentProps<'div'> & { host: PaneHostState, insetBottom?: number }) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const hostStyle: PaneHostStyle = { ...style, '--pane-inset-bottom': `${insetBottom}px` };

  return (
    <paneHostContext.Provider value={{ ...host, element }}>
      <div
        className={cn('relative', className)}
        data-slot="pane-host"
        ref={setElement}
        style={hostStyle}
        {...props}
      />
    </paneHostContext.Provider>
  );
}

function Pane({ open, onOpenChange, ...props }: Omit<DialogPrimitive.DialogProps, 'modal'>) {
  const host = use(paneHostContext);
  const close = useEffectEvent(() => onOpenChange?.(false));

  const register = host?.register;

  useEffect(() => (open && register ? register(close) : undefined), [open, register]);

  return (
    <DialogPrimitive.Root
      data-slot="pane"
      modal={false}
      open={open}
      onOpenChange={onOpenChange}
      {...props}
    />
  );
}

function PaneContent({ className, children, ...props }: ComponentProps<typeof DialogPrimitive.Content>) {
  const host = use(paneHostContext);

  return (
    <DialogPrimitive.Portal container={host?.element ?? document.querySelector<HTMLElement>('[data-slot=sidebar-inset]')}>
      {/* Above the chat and below its composer, under the shell's sidebar toggle, as a private chat sits. */}
      <DialogPrimitive.Content
        aria-describedby={undefined}
        className={cn('absolute inset-0 z-25 flex min-h-0 flex-col overflow-hidden bg-background outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none', className)}
        data-slot="pane-content"
        onEscapeKeyDown={(event) => {
          // Escape while renaming only cancels the rename.
          if (document.activeElement?.matches('[data-slot=pane-title-input]')) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => event.preventDefault()}
        {...props}
      >
        {/* The desktop window still drags from the top of the column, like the shell beneath. */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 hidden h-13 cursor-default electrobun-webkit-app-region-drag select-none desktop:block" />
        {children}
        {/* Top left, matching the sidebar's header buttons in size, style and inset; on a phone the sidebar toggle holds that corner, so it moves right. */}
        <DialogPrimitive.Close asChild>
          <Button
            aria-label={m.ui_close()}
            className="absolute top-2 right-2 z-10 electrobun-webkit-app-region-no-drag md:right-auto md:left-2"
            size="icon-sm"
            title={m.ui_close()}
            variant="outline"
          >
            <X className="size-4" />
          </Button>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** The top of a pane, holding its pill clear of the close button and the sidebar toggle. */
function PaneHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-14 pt-3 *:pointer-events-auto', className)} data-slot="pane-header" {...props} />;
}

const panePillVariants = cva({
  base: 'flex h-9 max-w-full min-w-0 items-center gap-2 rounded-full border bg-background text-sm font-medium shadow-sm has-[input:focus]:ring-2 has-[input:focus]:ring-ring/50',
  variants: {
    variant: {
      text: 'px-4',
      // An avatar at the start sits as close to the edge as the pill's curve allows.
      avatar: 'pr-4 pl-1.5',
    },
  },
  defaultVariants: { variant: 'text' },
});

function PanePill({ variant, className, ...props }: ComponentProps<'div'> & VariantProps<typeof panePillVariants>) {
  return <div className={cn(panePillVariants({ variant }), className)} data-slot="pane-pill" {...props} />;
}

interface PaneTitleProps {
  /** An emoji or icon before the name. */
  icon?: ReactNode
  children: string
  /** Makes the name editable in place; called with the trimmed new name when it changes. */
  onRename?: (title: string) => void
  renameLabel?: string
  maxLength?: number
}

/** The pane's name in its pill, cut short when it does not fit. Enter or leaving the field saves; Escape puts it back. */
function PaneTitle({ icon, children, onRename, renameLabel, maxLength }: PaneTitleProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? children;

  const commit = () => {
    const next = draft?.trim();

    setDraft(null);

    if (next && next !== children) {
      onRename?.(next);
    }
  };

  return (
    <PanePill>
      {icon ? <span aria-hidden="true" className="shrink-0 text-base leading-none">{icon}</span> : null}
      {onRename ? (
        <>
          <DialogPrimitive.Title className="sr-only">{children}</DialogPrimitive.Title>
          <input
            aria-label={renameLabel}
            className="field-sizing-content max-w-full min-w-0 cursor-text truncate bg-transparent outline-none"
            data-slot="pane-title-input"
            maxLength={maxLength}
            size={Math.max(2, value.length)}
            value={value}
            onBlur={commit}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              const input = event.currentTarget;

              if (event.key === 'Enter') {
                input.blur();
              }

              if (event.key === 'Escape') {
                setDraft(null);
                // Blur after the reset renders, so leaving the field does not save the discarded name.
                requestAnimationFrame(() => input.blur());
              }
            }}
          />
        </>
      ) : <DialogPrimitive.Title className="truncate" data-slot="pane-title">{children}</DialogPrimitive.Title>}
    </PanePill>
  );
}

const paneBodyVariants = cva({
  base: 'mx-auto w-full',
  variants: {
    size: {
      chat: 'max-w-3xl',
      wide: 'max-w-5xl',
      // A page brings its own margins, so it fills the pane edge to edge.
      full: '',
    },
  },
  defaultVariants: { size: 'chat' },
});

/** The pane's scrolling content, under the pill and clear of the host's composer. The scrollbar stays at the pane's edge. */
function PaneBody({ size, className, children, ...props }: ComponentProps<'div'> & VariantProps<typeof paneBodyVariants>) {
  return (
    <div
      className="scrollbar min-h-0 flex-1 overflow-y-auto px-4 pt-16 pb-[calc(var(--pane-inset-bottom,0px)+1rem)] [--scrollbar-thumb:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] [--scrollbar-track:transparent] scrollbar-h-1 scrollbar-thumb-rounded-full scrollbar-w-1 data-[size=full]:px-0"
      data-size={size}
      data-slot="pane-body"
      {...props}
    >
      <div className={cn(paneBodyVariants({ size }), className)}>{children}</div>
    </div>
  );
}

function PaneFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-wrap justify-center gap-2 p-4', className)} data-slot="pane-footer" {...props} />;
}

export { Pane, PaneBody, PaneContent, PaneFooter, PaneHeader, PaneHost, PanePill, PaneTitle, usePaneHost };
