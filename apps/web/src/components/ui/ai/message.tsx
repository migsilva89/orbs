import { useState } from 'react';
import { match } from 'ts-pattern';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import type { UIMessage } from 'ai';
import type { HTMLAttributes, ReactNode } from 'react';

/** The bubble's outline. Every card in the transcript wears it with `messageSurface`, so they read as one family. */
const messageOutline = 'rounded-3xl border border-input';

export const messageSurface = [messageOutline, 'bg-secondary text-foreground'];

/** The icon tile that leads a card's header or footer. */
export const messageTile = 'flex size-8 shrink-0 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground [&_svg]:size-4';

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role']
}

export function Message({ className, from, ...props }: MessageProps) {
  return (
    <div
      className={cn(
        'group flex w-full items-end justify-end gap-2 py-2',
        from !== 'user' && 'flex-row-reverse justify-end',
        className,
      )}
      data-role={from === 'user' ? 'user' : 'assistant'}
      {...props}
    />
  );
}

export function MessageStack({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex w-4/5 min-w-0 flex-col gap-1 group-data-[role=assistant]:w-full group-data-[role=assistant]:items-start group-data-[role=user]:items-end', className)} {...props} />;
}

export function MessageContent({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="w-fit max-w-full min-w-0 has-[[data-message-wide]]:w-full">
      <div
        className={cn(
          messageOutline,
          'flex flex-col gap-2 overflow-hidden px-3 py-2 text-sm leading-snug',
          'group-data-[role=user]:bg-bubble group-data-[role=user]:text-bubble-foreground',
          'group-data-[role=user]:selection:bg-bubble-foreground group-data-[role=user]:selection:text-bubble',
          'group-data-[role=assistant]:bg-secondary group-data-[role=assistant]:text-foreground',
          className,
        )}
        data-slot="message-content"
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

const MESSAGE_CLAMP_HEIGHT = 320;

const MESSAGE_CLAMP_FADE = 'linear-gradient(to bottom, black calc(100% - 1.75rem), transparent)';

// Opened bubbles stay open for the session, so a transcript that unmounts a row while scrolling brings it back the same.
const messageClampOpen = new Set<string>();

/** Caps a long bubble at a fixed height, fading its last lines, with a toggle that shows the rest. */
export function MessageClamp({ id, expandLabel, collapseLabel, children }: { id: string, expandLabel: string, collapseLabel: string, children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(() => messageClampOpen.has(id));
  const [isLong, setIsLong] = useState(false);
  const isFaded = isLong && !isOpen;

  const measure = (content: HTMLDivElement | null) => {
    if (!content) {
      return;
    }

    const observer = new ResizeObserver(() => setIsLong(content.offsetHeight > MESSAGE_CLAMP_HEIGHT));
    observer.observe(content);

    return () => observer.disconnect();
  };

  const toggle = () => {
    match(isOpen)
      .with(true, () => messageClampOpen.delete(id))
      .with(false, () => messageClampOpen.add(id))
      .exhaustive();

    setIsOpen(!isOpen);
  };

  const button = (
    <Button
      aria-expanded={isOpen}
      className={cn('self-center hover:bg-foreground/10', !isOpen && 'absolute bottom-0 left-1/2 -translate-x-1/2')}
      size="xs"
      type="button"
      variant="ghost"
      onClick={toggle}
    >
      {isOpen ? collapseLabel : expandLabel}
    </Button>
  );

  // While closed the toggle sits over the faded lines, so finding a bubble long only after it is drawn never changes its height.
  return (
    <>
      <div className="relative flex flex-col">
        <div
          className={cn(!isOpen && 'overflow-hidden')}
          style={isOpen ? undefined : { maxHeight: MESSAGE_CLAMP_HEIGHT, maskImage: isFaded ? MESSAGE_CLAMP_FADE : undefined }}
        >
          <div className="flex flex-col gap-2" ref={measure}>{children}</div>
        </div>
        {isFaded ? button : null}
      </div>
      {isLong && isOpen ? button : null}
    </>
  );
}
