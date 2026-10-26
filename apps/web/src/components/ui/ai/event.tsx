import { m } from '@repo/i18n/client';
import { cva } from 'cva';
import { cn } from '@/lib/cn';
import IconLucideBan from '~icons/lucide/ban';
import IconLucideCheck from '~icons/lucide/check';
import IconLucideChevronDown from '~icons/lucide/chevron-down';
import IconLucideCircleAlert from '~icons/lucide/circle-alert';
import IconLucideLoaderCircle from '~icons/lucide/loader-circle';
import IconLucideShieldQuestion from '~icons/lucide/shield-question';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../collapsible';
import type { VariantProps } from 'cva';
import type { ComponentProps, ReactNode } from 'react';

type EventStatus = 'running' | 'done' | 'error' | 'approval' | 'denied'

// Every chat event reads the same: a centred muted line of label, then icon and name a step brighter, then a status
// icon. An event with details opens into a card whose header is that same line. Icons and avatars all sit in 16px.
const eventLine = 'flex h-8 max-w-full min-w-0 items-center gap-1.5 text-sm text-muted-foreground data-[status=running]:*:data-[slot=event-label]:shimmer';

const eventFocus = 'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset';

/** A run of events, stacked and centred. */
function EventList({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex w-full min-w-0 flex-col items-center py-1', className)} data-slot="event-list" {...props} />;
}

/** One line that does not open. */
function EventLine({ status, className, children, ...props }: ComponentProps<'div'> & { status?: EventStatus }) {
  return (
    <div className={cn(eventLine, 'px-2', className)} data-slot="event-line" data-status={status} {...props}>
      {children}
      <EventStatusIcon status={status} />
    </div>
  );
}

function EventLabel({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cn('min-w-0 shrink-0 truncate motion-reduce:shimmer-none', className)} data-slot="event-label" {...props} />;
}

/** The thing the event is about, with its icon: a todo, a routine, a bot, a command. Several icons overlap in a stack, like avatars. */
function EventName({ icon, className, children, ...props }: ComponentProps<'span'> & { icon?: ReactNode | ReactNode[] }) {
  const stack = Array.isArray(icon) ? (
    <span aria-hidden="true" className="-my-0.5 flex shrink-0 -space-x-1.5">
      {icon.map((item, index) => (
        <span className="flex size-5 items-center justify-center overflow-hidden rounded-full border bg-background [&>svg]:size-3" key={index}>{item}</span>
      ))}
    </span>
  ) : null;

  return (
    <span className={cn('flex min-w-0 items-center gap-1.5 text-foreground/80', className)} data-slot="event-name" {...props}>
      {stack ?? (icon ? <EventIcon>{icon}</EventIcon> : null)}
      {children === undefined ? null : <span className="min-w-0 truncate">{children}</span>}
    </span>
  );
}

function EventIcon({ className, ...props }: ComponentProps<'span'>) {
  return <span aria-hidden="true" className={cn('flex size-4 shrink-0 items-center justify-center [&_svg]:size-4', className)} data-slot="event-icon" {...props} />;
}

const eventStatusIcons = {
  running: <IconLucideLoaderCircle className="animate-spin text-muted-foreground motion-reduce:animate-none" />,
  done: <IconLucideCheck className="text-success" />,
  error: <IconLucideCircleAlert className="text-destructive" />,
  approval: <IconLucideShieldQuestion className="text-foreground" />,
  denied: <IconLucideBan className="text-muted-foreground" />,
} satisfies Record<EventStatus, ReactNode>;

/** Status as an icon with a spoken label. A line hides running and done; its label shimmers while running. */
function EventStatusIcon({ status, isDetailed = false, className }: { status: EventStatus | undefined, isDetailed?: boolean, className?: string }) {
  if (!status || (!isDetailed && (status === 'running' || status === 'done'))) {
    return null;
  }

  const labels = {
    running: m.ui_tool_state_running(),
    done: m.ui_tool_state_completed(),
    error: m.ui_tool_state_error(),
    approval: m.ui_tool_state_approval(),
    denied: m.ui_tool_state_denied(),
  } satisfies Record<EventStatus, string>;

  return (
    <EventIcon aria-hidden={false} className={cn('[&_svg]:size-3', className)} title={labels[status]}>
      {eventStatusIcons[status]}
      <span className="sr-only">{labels[status]}</span>
    </EventIcon>
  );
}

function EventChevron({ className }: { className?: string }) {
  return (
    <EventIcon className={cn('text-muted-foreground transition-transform duration-200 ease-out-quint motion-reduce:transition-none', className)}>
      <IconLucideChevronDown />
    </EventIcon>
  );
}

/** An event that opens a card under its line. The line never moves; only the card grows and shrinks. */
function Event({ className, ...props }: ComponentProps<typeof Collapsible>) {
  return <Collapsible className={cn('group/event flex w-full min-w-0 flex-col items-center', className)} data-slot="event" {...props} />;
}

/** The line that opens an event. */
function EventTrigger({ status, className, children, ...props }: Omit<ComponentProps<typeof CollapsibleTrigger>, 'asChild'> & { status?: EventStatus }) {
  return (
    <CollapsibleTrigger
      className={cn(eventLine, eventFocus, 'cursor-pointer rounded-md px-2 text-left', className)}
      data-slot="event-trigger"
      data-status={status}
      {...props}
    >
      {children}
      <EventStatusIcon status={status} />
      <EventChevron className="group-data-[state=open]/event:rotate-180" />
    </CollapsibleTrigger>
  );
}

/** The card under an open event's line. */
function EventContent({ className, children, ...props }: ComponentProps<typeof CollapsibleContent>) {
  return (
    <CollapsibleContent className="w-full max-w-lg" data-slot="event-content" {...props}>
      <div className={cn('mt-1 mb-2 overflow-hidden rounded-2xl border bg-card', className)}>{children}</div>
    </CollapsibleContent>
  );
}

const eventBodyVariants = cva({
  base: 'scrollbar max-h-72 overflow-y-auto overscroll-contain px-3 py-2.5 wrap-break-word text-muted-foreground [--scrollbar-thumb:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] [--scrollbar-track:transparent] scrollbar-h-1 scrollbar-thumb-rounded-full scrollbar-w-1',
  variants: {
    variant: {
      text: 'text-sm whitespace-pre-wrap',
      markdown: 'text-sm',
    },
  },
  defaultVariants: { variant: 'text' },
});

/** Detail text in an open card: a note, an error, or a thought in markdown. */
function EventBody({ variant, className, ...props }: ComponentProps<'div'> & VariantProps<typeof eventBodyVariants>) {
  return <div className={cn(eventBodyVariants({ variant }), className)} data-slot="event-body" {...props} />;
}

/** Structured details, such as a tool call's input and output, in an open card or under an item. */
function EventDetails({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex min-w-0 flex-col gap-2 px-3 py-2.5 text-xs text-muted-foreground in-data-[slot=event-item]:pt-0 in-data-[slot=event-item]:pb-3 in-data-[slot=event-item]:pl-10', className)} data-slot="event-details" {...props} />;
}

function EventItems({ className, ...props }: ComponentProps<'ul'>) {
  return <ul className={cn('flex min-w-0 flex-col py-1', className)} data-slot="event-items" {...props} />;
}

/** One row of an open card, such as a tool call, that opens on its own details. */
function EventItem({ icon, label, preview, description, status, className, children, ...props }: ComponentProps<typeof Collapsible> & {
  icon: ReactNode
  label: string
  preview?: string
  description?: string
  status: EventStatus
}) {
  return (
    <li className="min-w-0" data-slot="event-item">
      <Collapsible className={cn('group/event-item flex min-w-0 flex-col', className)} {...props}>
        <CollapsibleTrigger className={cn(eventFocus, 'flex w-full min-w-0 cursor-pointer items-start gap-3 px-3 py-2 text-left text-sm')}>
          <EventIcon className="mt-0.5 text-muted-foreground">{icon}</EventIcon>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-foreground data-[status=running]:shimmer motion-reduce:shimmer-none" data-status={status}>
              {label}
              {preview ? <span className="ml-1.5 text-muted-foreground">{preview}</span> : null}
            </span>
            {description ? <span className="truncate text-xs text-muted-foreground">{description}</span> : null}
          </span>
          <span className="mt-0.5 flex shrink-0 items-center gap-2">
            <EventStatusIcon isDetailed status={status} />
            <EventChevron className="group-data-[state=open]/event-item:rotate-180" />
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <EventDetails>{children}</EventDetails>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

export { Event, EventBody, EventContent, EventDetails, EventItem, EventItems, EventLabel, EventLine, EventList, EventName, EventTrigger };
export type { EventStatus };
