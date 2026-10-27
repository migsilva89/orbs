import { m } from '@repo/i18n/client';
import { Slot as SlotPrimitive } from 'radix-ui';
import { useEffect, useRef, useState } from 'react';
import IconX from '~icons/lucide/x';
import { cn } from '../lib/cn';
import { Button } from './button';
import { ButtonLoading } from './button-loading';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from './dialog';
import type { ComponentProps, ReactNode } from 'react';

interface SectionDialogProps {
  title: string
  description: string
  /** Fills the screen, for content that needs room. */
  isExpanded?: boolean
  onClose: () => void
  children: ReactNode
}

/**
 * A dialog with its sections listed on the left, or as tabs on top below 720px.
 * Escape inside an element marked `data-escape="local"` stays with that element.
 */
export function SectionDialog({ title, description, isExpanded = false, onClose, children }: SectionDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        flush
        close={false}
        className={cn(
          '@container/section-dialog flex flex-col overflow-hidden max-sm:-m-4 max-sm:h-svh max-sm:w-screen max-sm:max-w-none',
          isExpanded ? '-m-4 h-svh w-screen max-w-none' : 'h-[min(40rem,calc(100svh-2rem))] max-w-4xl',
        )}
        onEscapeKeyDown={(event) => event.target instanceof Element && event.target.closest('[data-escape=local]') && event.preventDefault()}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          if (event.currentTarget instanceof HTMLElement) {
            event.currentTarget.focus();
          }
        }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-card ring-1 ring-border ring-inset sm:rounded-lg @min-[720px]/section-dialog:flex-row">
          {children}
        </div>
        <DialogClose asChild>
          <Button
            aria-label={m.ui_close()}
            className="absolute top-3 right-3 @min-[720px]/section-dialog:top-6 @min-[720px]/section-dialog:right-6"
            size="icon-sm"
            title={m.ui_close()}
            type="button"
            variant="ghost"
          >
            <IconX className="opacity-70" />
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

interface SectionDialogNavProps {
  label: string
  header: ReactNode
  activeKey: string
  footer?: ReactNode
  children: ReactNode
}

export function SectionDialogNav({ label, header, activeKey, footer, children }: SectionDialogNavProps) {
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    list.current?.querySelector('[aria-current=page]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeKey]);

  return (
    <nav aria-label={label} className="flex min-w-0 shrink-0 flex-col gap-2 border-b bg-muted/40 py-3.5 @min-[720px]/section-dialog:w-54 @min-[720px]/section-dialog:gap-4 @min-[720px]/section-dialog:border-r @min-[720px]/section-dialog:border-b-0 @min-[720px]/section-dialog:px-2 @min-[720px]/section-dialog:pt-4 @min-[720px]/section-dialog:pb-2">
      <div className="pr-14 pl-5 @min-[720px]/section-dialog:px-1">{header}</div>
      <ul className="flex snap-x snap-mandatory scroll-px-2 [scrollbar-width:none] gap-0.5 overflow-x-auto mask-r-from-85% pr-16 pl-2 @min-[720px]/section-dialog:min-h-0 @min-[720px]/section-dialog:flex-1 @min-[720px]/section-dialog:snap-none @min-[720px]/section-dialog:flex-col @min-[720px]/section-dialog:overflow-x-visible @min-[720px]/section-dialog:overflow-y-auto @min-[720px]/section-dialog:mask-none @min-[720px]/section-dialog:px-0" ref={list}>
        {children}
      </ul>
      {footer ? <div className="hidden flex-col items-start @min-[720px]/section-dialog:flex">{footer}</div> : null}
    </nav>
  );
}

export function SectionDialogNavTitle({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-base font-medium @min-[720px]/section-dialog:px-2', className)} {...props} />;
}

export function SectionDialogNavLabel({ className, ...props }: ComponentProps<'li'>) {
  return <li className={cn('flex shrink-0 items-center gap-1.5 pr-1 pl-3 text-xs text-muted-foreground @min-[720px]/section-dialog:px-3 @min-[720px]/section-dialog:pt-3 @min-[720px]/section-dialog:pb-1 @min-[720px]/section-dialog:first:pt-0', className)} {...props} />;
}

interface SectionDialogNavItemProps {
  isActive: boolean
  className?: string
  children: ReactNode
}

/** Wraps one link; the link gets the item styles and `aria-current` when active. */
export function SectionDialogNavItem({ isActive, className, children }: SectionDialogNavItemProps) {
  return (
    <li className={cn('shrink-0 snap-start', className)}>
      <SlotPrimitive.Slot
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex min-h-8 items-center gap-2.5 rounded-lg border border-transparent px-3 text-sm whitespace-nowrap text-muted-foreground transition-colors outline-none focus-visible:bg-muted/70 focus-visible:text-foreground',
          '[&_svg]:hidden [&_svg]:size-4 [&_svg]:shrink-0 @min-[720px]/section-dialog:[&_svg]:block',
          isActive ? 'border-border bg-card text-foreground shadow-xs' : 'hover:bg-muted/70 hover:text-foreground',
        )}
      >
        {children}
      </SlotPrimitive.Slot>
    </li>
  );
}

interface SectionDialogBodyProps {
  title?: string
  description?: string
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

/** The content column: a fixed header with the title, actions and room for close, over the scrolling content. A line under the header shows once the content scrolls under it. Without a title the content brings its own heading. */
export function SectionDialogBody({ title, description, actions, footer, children }: SectionDialogBodyProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header
        className={cn(
          'flex min-h-7 shrink-0 flex-wrap items-start gap-3 border-b px-5 pt-5 pr-14 transition-colors @min-[720px]/section-dialog:px-8 @min-[720px]/section-dialog:pt-6 @min-[720px]/section-dialog:pr-16',
          title ? 'pb-4' : 'pb-2',
          isScrolled ? 'border-border' : 'border-transparent',
        )}
      >
        {title ? (
          <div className="flex min-w-0 flex-1 basis-full flex-col gap-0.5 @min-[720px]/section-dialog:basis-0">
            <h2 className="truncate text-lg font-semibold">{title}</h2>
            {description ? <p className="truncate text-sm text-muted-foreground">{description}</p> : null}
          </div>
        ) : null}
        {actions}
      </header>
      <div
        className="scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain [--scrollbar-thumb:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] [--scrollbar-track:transparent] scrollbar-h-1 scrollbar-thumb-rounded-full scrollbar-w-1"
        onScroll={(event) => setIsScrolled(event.currentTarget.scrollTop > 0)}
      >
        <div className={cn('flex flex-col gap-10 px-5 pb-5 @min-[720px]/section-dialog:px-8 @min-[720px]/section-dialog:pb-6', title && 'pt-6')}>
          {children}
        </div>
      </div>
      {footer}
    </div>
  );
}

interface SectionDialogSaveBarProps {
  message?: string
  saveLabel?: string
  isPending: boolean
  onDiscard?: () => void
  onSave: () => void
}

/** The bar that saves a form, shown while it has unsaved changes. Cmd+S is wired by the dialog that shows it. */
export function SectionDialogSaveBar({ message = m.ui_unsaved_changes(), saveLabel = m.ui_save(), isPending, onDiscard, onSave }: SectionDialogSaveBarProps) {
  return (
    <output className="mx-3 mb-3 flex animate-in items-center gap-2 rounded-xl border bg-popover py-2 pr-2 pl-4 shadow-lg duration-200 fade-in-0 slide-in-from-bottom-2 @min-[720px]/section-dialog:mx-6 @min-[720px]/section-dialog:mb-4">
      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{message}</span>
      <kbd className="hidden rounded border px-1.5 font-mono text-xxs text-muted-foreground sm:inline">⌘S</kbd>
      {onDiscard ? (
        <Button
          disabled={isPending}
          size="sm"
          type="button"
          variant="ghost"
          onClick={onDiscard}
        >
          {m.ui_discard()}
        </Button>
      ) : null}
      <ButtonLoading
        loading={isPending}
        size="sm"
        type="button"
        onClick={onSave}
      >
        {saveLabel}
      </ButtonLoading>
    </output>
  );
}
