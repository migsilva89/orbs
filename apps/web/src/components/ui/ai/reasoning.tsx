import { m } from '@repo/i18n/client';
import { createContext, use, useState } from 'react';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { TraceCollapsibleTrigger, TraceIcon, TraceLine, TraceTitle } from '@/components/ui/trace';
import { cn } from '@/lib/cn';
import IconBrain from '~icons/lucide/brain';
import { Response } from './response';
import type { ComponentProps } from 'react';

const ReasoningContext = createContext(false);

export function Reasoning({ className, isStreaming = false, children, ...props }: Omit<ComponentProps<typeof Collapsible>, 'open' | 'defaultOpen' | 'onOpenChange'> & { isStreaming?: boolean }) {
  const [open, setOpen] = useState<boolean>();

  return (
    <ReasoningContext value={isStreaming}>
      <Collapsible className={cn('w-full min-w-0 py-2', className)} open={open ?? isStreaming} onOpenChange={setOpen} {...props}>
        {children}
      </Collapsible>
    </ReasoningContext>
  );
}

export function ReasoningTrigger({ className, children, botName, ...props }: ComponentProps<typeof TraceCollapsibleTrigger> & { botName: string }) {
  const isStreaming = use(ReasoningContext);

  return (
    <TraceCollapsibleTrigger
      className={cn('h-7 zoom-[0.8] px-1.5 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset', className)}
      {...props}
    >
      {children ?? (
        <TraceLine className="gap-1.5 text-xs" status={isStreaming ? 'running' : undefined}>
          <TraceIcon><IconBrain /></TraceIcon>
          <TraceTitle>{isStreaming ? m.ui_reasoning_streaming({ name: botName }) : m.ui_reasoning_complete({ name: botName })}</TraceTitle>
        </TraceLine>
      )}
    </TraceCollapsibleTrigger>
  );
}

export function ReasoningContent({ className, children, ...props }: Omit<ComponentProps<typeof CollapsibleContent>, 'children'> & { children: string }) {
  return (
    <CollapsibleContent className={cn('mt-2 text-sm text-muted-foreground motion-reduce:animate-none', className)} {...props}>
      <div className="scrollbar-thin max-h-64 overflow-y-auto overscroll-contain pr-2 wrap-anywhere">
        <Response className="space-y-1 leading-snug">{children}</Response>
      </div>
    </CollapsibleContent>
  );
}
