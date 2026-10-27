import { cva } from 'cva';
import { createContext, use, useState } from 'react';
import { createPortal } from 'react-dom';
import { match } from 'ts-pattern';
import { cn } from '@/lib/cn';
import IconLucideArrowUp from '~icons/lucide/arrow-up';
import IconLucideFileText from '~icons/lucide/file-text';
import IconLucideLoader2 from '~icons/lucide/loader-2';
import IconLucidePlus from '~icons/lucide/plus';
import IconLucideReply from '~icons/lucide/reply';
import IconLucideSquare from '~icons/lucide/square';
import IconLucideX from '~icons/lucide/x';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../dropdown-menu';
import { InputGroup, InputGroupAddon, InputGroupButton } from '../input-group';
import type { ChatStatus } from 'ai';
import type { VariantProps } from 'cva';
import type * as ReactTypes from 'react';

export interface PromptInputMessage {
  text: string
}

export type PromptInputProps = Omit<ReactTypes.HTMLAttributes<HTMLFormElement>, 'onSubmit'> & {
  onSubmit: (message: PromptInputMessage, event: ReactTypes.FormEvent<HTMLFormElement>) => boolean | Promise<boolean>
  /** A `PromptInputStatus` line framed together with the composer, such as what the bot is doing. */
  status?: ReactTypes.ReactNode
}

// Where `PromptInputDrawer` renders: outside the `InputGroup`, whose `overflow-hidden` would clip it.
const PromptInputDrawerSlot = createContext<HTMLDivElement | null>(null);

/** The composer, following Vercel AI Elements: an `InputGroup` whose addons hold the actions around the field; it resets once `onSubmit` reports the message sent, so a failed send keeps what was typed. */
export function PromptInput({ status, className, onSubmit, children, ...props }: PromptInputProps) {
  const [drawer, setDrawer] = useState<HTMLDivElement | null>(null);

  const handleSubmit: ReactTypes.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const field = form.elements.namedItem('message');

    const text = field instanceof HTMLInputElement ? field.value : '';

    void Promise.resolve(onSubmit({ text }, event)).then((sent) => {
      if (sent && field instanceof HTMLInputElement && field.value === text && form.isConnected) {
        form.reset();
      }
    });
  };

  const field = (
    <PromptInputDrawerSlot value={drawer}>
      {/* Actions sit on the last line, so they stay put while the field grows; the solid dark fill hides the drawer behind it. */}
      <InputGroup className="relative flex-wrap items-end overflow-hidden duration-240 ease-panel group-data-status/prompt-input:shadow-none has-[>[data-align=block-start]]:flex-row motion-reduce:transition-none has-[[data-multiline=true]]:[&>[data-align=inline-end]]:ml-auto has-[[data-multiline=true]]:[&>[data-align=inline-start]]:order-last" variant="prompt">{children}</InputGroup>
    </PromptInputDrawerSlot>
  );

  return (
    <form
      className={cn('group/prompt-input relative w-full', className)}
      data-status={status ? '' : undefined}
      onSubmit={handleSubmit}
      {...props}
    >
      {/* The drawer's bottom edge runs 1rem under the composer, so it looks pulled out from behind it. */}
      <div className="absolute inset-x-5 bottom-[calc(100%-1rem)]" ref={setDrawer} />
      {status ? (
        // The status shares one frame with the field; the frame's fill also hides the drawer behind it.
        <div className="relative rounded-[1.75rem] border bg-background p-1 shadow-sm dark:bg-card">
          {status}
          {field}
        </div>
      ) : field}
    </form>
  );
}

interface PromptInputStatusProps {
  avatar: ReactTypes.ReactNode
  /** Work in progress shimmers; a message waiting to be read does not. */
  isLive: boolean
  children: string
  onClick: () => void
}

/** One line above the composer, in the same frame: the bot's avatar and what it is doing, or its latest unread message. */
export function PromptInputStatus({ avatar, isLive, children, onClick }: PromptInputStatusProps) {
  return (
    <button
      className="flex h-9 w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-full px-2.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title={children}
      type="button"
      onClick={onClick}
    >
      <span className="flex size-6 shrink-0 items-center justify-center">{avatar}</span>
      <span className={cn('min-w-0 truncate', isLive ? 'shimmer text-muted-foreground motion-reduce:shimmer-none' : 'text-foreground/80')}>{children}</span>
    </button>
  );
}

const promptInputDrawerVariants = cva({
  base: 'scrollbar flex max-h-72 flex-col overflow-y-auto rounded-t-xl border border-b-0 px-1 pt-0.5 pb-[1.125rem] shadow-sm [--scrollbar-thumb:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] [--scrollbar-track:transparent] scrollbar-h-1 scrollbar-thumb-rounded-full scrollbar-w-1',
  variants: {
    variant: {
      default: 'bg-popover text-popover-foreground',
      destructive: 'border-destructive/20 bg-[color-mix(in_oklab,var(--destructive)_8%,var(--popover))] text-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

/** A panel tucked behind the composer's top edge, as wide as the composer minus its corners; it scrolls when tall. */
export function PromptInputDrawer({
  variant,
  className,
  children,
}: VariantProps<typeof promptInputDrawerVariants> & { className?: string; children: ReactTypes.ReactNode }) {
  const drawer = use(PromptInputDrawerSlot);

  if (!drawer) {
    return null;
  }

  return createPortal(
    <div className={cn(promptInputDrawerVariants({ variant }), className)}>
      {children}
    </div>,
    drawer,
  );
}

/** A warning in a destructive drawer, such as a message or file that failed to send. */
export function PromptInputDrawerAlert({ children }: { children: ReactTypes.ReactNode }) {
  return <output className="block px-2 py-1 text-xs" role="alert">{children}</output>;
}

export function PromptInputQuote({ children, removeLabel, onRemove }: { children: ReactTypes.ReactNode; removeLabel: string; onRemove: () => void }) {
  return (
    <InputGroupAddon align="block-start">
      <div className="flex w-full min-w-0 items-center gap-2 rounded-xl bg-muted py-1 pr-1 pl-3 text-xs font-normal text-muted-foreground">
        <IconLucideReply className="size-3.5 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{children}</span>
        <PromptInputButton
          aria-label={removeLabel}
          size="icon-xs"
          title={removeLabel}
          onClick={onRemove}
        >
          <IconLucideX className="size-3.5" />
        </PromptInputButton>
      </div>
    </InputGroupAddon>
  );
}

export function PromptInputAttachment({ name, preview, image, status, removeLabel, onRemove }: {
  name: string
  preview: string
  image: boolean
  status: 'uploading' | 'ready' | 'failed'
  removeLabel: string
  onRemove: () => void
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl bg-muted p-1 text-xs text-muted-foreground data-[status=failed]:text-destructive" data-status={status}>
      {image ? <img alt="" className="size-8 rounded-lg object-cover" src={preview} /> : <IconLucideFileText className="ml-2 size-3.5 shrink-0" />}
      <span className="max-w-40 truncate">{name}</span>
      {status === 'uploading' ? <IconLucideLoader2 className="size-3.5 shrink-0 animate-spin motion-reduce:animate-none" /> : null}
      <PromptInputButton
        aria-label={removeLabel}
        size="icon-xs"
        title={removeLabel}
        onClick={onRemove}
      >
        <IconLucideX className="size-3.5" />
      </PromptInputButton>
    </div>
  );
}

export function PromptInputButton({ className, variant = 'ghost', size = 'icon-sm', ...props }: ReactTypes.ComponentProps<typeof InputGroupButton>) {
  return <InputGroupButton className={cn('rounded-full', className)} size={size} variant={variant} {...props} />;
}

export function PromptInputActionMenu(props: ReactTypes.ComponentProps<typeof DropdownMenu>) {
  return <DropdownMenu {...props} />;
}

export function PromptInputActionMenuTrigger({ children, className, ...props }: ReactTypes.ComponentProps<typeof PromptInputButton>) {
  return (
    <DropdownMenuTrigger asChild>
      <PromptInputButton className={cn('border border-black/8 dark:border-white/12', className)} {...props}>{children ?? <IconLucidePlus className="size-4" />}</PromptInputButton>
    </DropdownMenuTrigger>
  );
}

export function PromptInputActionMenuContent(props: ReactTypes.ComponentProps<typeof DropdownMenuContent>) {
  return <DropdownMenuContent align="start" {...props} />;
}

export function PromptInputActionMenuItem(props: ReactTypes.ComponentProps<typeof DropdownMenuItem>) {
  return <DropdownMenuItem {...props} />;
}

export type PromptInputSubmitProps = ReactTypes.ComponentProps<typeof PromptInputButton> & {
  status?: ChatStatus
}

export function PromptInputSubmit({ variant = 'default', status, children, ...props }: PromptInputSubmitProps) {
  const icon = match(status)
    .with('submitted', () => <IconLucideLoader2 className="size-4 animate-spin motion-reduce:animate-none" />)
    .with('streaming', () => <IconLucideSquare className="size-3.5" />)
    .with('error', () => <IconLucideX className="size-4" />)
    .otherwise(() => <IconLucideArrowUp className="size-4" />);

  return (
    <PromptInputButton type="submit" variant={variant} {...props}>
      {children ?? icon}
    </PromptInputButton>
  );
}
