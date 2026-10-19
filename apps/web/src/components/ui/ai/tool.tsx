import { m } from '@openbots/i18n/client';
import { cva } from 'cva';
import { cn } from '@/lib/cn';
import IconLucideBan from '~icons/lucide/ban';
import IconLucideChevronRight from '~icons/lucide/chevron-right';
import IconLucideShieldQuestion from '~icons/lucide/shield-question';
import IconLucideX from '~icons/lucide/x';
import { Trace, TraceCollapsible, TraceCollapsibleContent, TraceCollapsibleTrigger, TraceDescription, TraceIcon, TraceLine, TraceTitle } from '../trace';
import type { TraceStatus } from '../trace';
import type { ToolUIPart } from 'ai';
import type { VariantProps } from 'cva';
import type { ComponentProps, ReactNode } from 'react';

const toolEase = 'duration-300 ease-out-quint motion-reduce:transition-none motion-reduce:animate-none';

const toolRow = 'flex h-7 w-fit max-w-full min-w-0 items-center gap-1 rounded-md px-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset';

const toolLine = 'gap-1.5 text-xs';

const toolStatuses = {
  'input-streaming': 'running',
  'input-available': 'running',
  'approval-requested': undefined,
  'approval-responded': 'running',
  'output-available': undefined,
  'output-error': 'error',
  'output-denied': undefined,
} satisfies Record<ToolUIPart['state'], TraceStatus | undefined>;

export function ToolGroup({ className, ...props }: ComponentProps<typeof Trace>) {
  return <Trace className={cn('mx-auto w-fit max-w-full zoom-[0.8] gap-0 py-3', className)} {...props} />;
}

export function ToolGroupToggle({ open, avatar, state, className, children, ...props }: ComponentProps<'button'> & {
  open: boolean
  avatar?: ReactNode
  state: ToolUIPart['state']
}) {
  return (
    <button
      aria-expanded={open}
      className={cn(toolRow, 'group/tool-group-toggle cursor-pointer', className)}
      type="button"
      {...props}
    >
      <TraceLine className={toolLine} status={toolStatuses[state]}>
        {avatar ? <TraceIcon>{avatar}</TraceIcon> : null}
        <TraceTitle className="shrink-0 tabular-nums">{children}</TraceTitle>
        <ToolStatus state={state} />
      </TraceLine>
      <TraceIcon className="text-muted-foreground transition-transform group-aria-expanded/tool-group-toggle:rotate-90 motion-reduce:transition-none">
        <IconLucideChevronRight />
      </TraceIcon>
    </button>
  );
}

const toolGroupItemVariants = cva({
  base: ['grid transition-[grid-template-rows,opacity]', toolEase],
  variants: {
    collapsed: {
      true: 'grid-rows-[0fr] opacity-0',
      false: 'grid-rows-[1fr] opacity-100',
    },
    enter: {
      true: 'animate-in fade-in slide-in-from-bottom-1',
      false: '',
    },
  },
  defaultVariants: {
    collapsed: false,
    enter: false,
  },
});

export function ToolGroupItem({ collapsed, enter, className, children, ...props }: ComponentProps<'div'> & VariantProps<typeof toolGroupItemVariants>) {
  return (
    <div aria-hidden={collapsed ?? undefined} className={cn(toolGroupItemVariants({ collapsed, enter }), className)} inert={collapsed ?? undefined} {...props}>
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

export function Tool(props: ComponentProps<typeof TraceCollapsible>) {
  return <TraceCollapsible {...props} />;
}

export function ToolStatus({ state }: { state: ToolUIPart['state'] }) {
  const labels = {
    'input-streaming': m.ui_tool_state_pending(),
    'input-available': m.ui_tool_state_running(),
    'approval-requested': m.ui_tool_state_approval(),
    'approval-responded': m.ui_tool_state_running(),
    'output-available': m.ui_tool_state_completed(),
    'output-error': m.ui_tool_state_error(),
    'output-denied': m.ui_tool_state_denied(),
  } satisfies Record<ToolUIPart['state'], string>;

  const icons = {
    'input-streaming': undefined,
    'input-available': undefined,
    'approval-requested': <IconLucideShieldQuestion className="size-3 text-foreground" />,
    'approval-responded': undefined,
    'output-available': undefined,
    'output-error': <IconLucideX className="size-3" />,
    'output-denied': <IconLucideBan className="size-3" />,
  } satisfies Record<ToolUIPart['state'], ReactNode>;

  const icon = icons[state];

  return (
    <>
      {icon ? <TraceIcon className="size-3.5" title={labels[state]}>{icon}</TraceIcon> : null}
      <span className="sr-only">{labels[state]}</span>
    </>
  );
}

export function ToolTrigger({ avatar, icon, name, preview, state, className, ...props }: ComponentProps<typeof TraceCollapsibleTrigger> & {
  avatar?: ReactNode
  icon?: ReactNode
  name: string
  preview?: ReactNode
  state: ToolUIPart['state']
}) {
  return (
    <TraceCollapsibleTrigger className={cn(toolRow, className)} {...props}>
      <TraceLine className={toolLine} status={toolStatuses[state]}>
        {avatar ? <TraceIcon>{avatar}</TraceIcon> : null}
        <TraceTitle className="shrink-0">{name}</TraceTitle>
        {icon ? <TraceIcon className="size-3.5 [&_svg:not([class*='size-'])]:size-3.5 [[data-slot=trace-title]~&]:ml-0">{icon}</TraceIcon> : null}
        {preview ? <TraceDescription className="min-w-0 shrink truncate text-foreground/80">{preview}</TraceDescription> : null}
        <ToolStatus state={state} />
      </TraceLine>
    </TraceCollapsibleTrigger>
  );
}

export function ToolContent({ className, children, ...props }: ComponentProps<typeof TraceCollapsibleContent>) {
  return (
    <TraceCollapsibleContent className={cn('mt-1 mb-2 flex flex-col gap-2', className)} {...props}>
      {children}
    </TraceCollapsibleContent>
  );
}

const toolCodeVariants = cva({
  base: 'scrollbar-thin max-h-64 max-w-full overflow-auto font-mono text-xxs leading-relaxed whitespace-pre outline-hidden',
  variants: {
    variant: {
      default: 'text-muted-foreground',
      destructive: 'text-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export function ToolCode({ variant, className, ...props }: ComponentProps<'pre'> & VariantProps<typeof toolCodeVariants>) {
  return <pre className={cn(toolCodeVariants({ variant }), className)} {...props} />;
}
