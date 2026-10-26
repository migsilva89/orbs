import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import type { UIMessage } from 'ai';
import type { HTMLAttributes, ReactNode } from 'react';

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
          'flex flex-col gap-2 overflow-hidden rounded-3xl border border-input px-3 py-2 text-sm leading-snug',
          'group-data-[role=user]:bg-bubble group-data-[role=user]:text-bubble-foreground',
          'group-data-[role=user]:selection:bg-bubble-foreground group-data-[role=user]:selection:text-bubble',
          'group-data-[role=assistant]:bg-secondary group-data-[role=assistant]:text-foreground',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

const MESSAGE_CLAMP_HEIGHT = 320;

const MESSAGE_CLAMP_FADE = 'linear-gradient(to bottom, black calc(100% - 1.75rem), transparent)';

/** Caps a long bubble at a fixed height, fading its last lines, with a toggle that shows the rest. */
export function MessageClamp({ expandLabel, collapseLabel, children }: { expandLabel: string, collapseLabel: string, children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <>
      <div
        className={cn(!isOpen && 'overflow-hidden')}
        style={isOpen ? undefined : { maxHeight: MESSAGE_CLAMP_HEIGHT, maskImage: isFaded ? MESSAGE_CLAMP_FADE : undefined }}
      >
        <div className="flex flex-col gap-2" ref={measure}>{children}</div>
      </div>
      {isLong ? (
        <Button
          aria-expanded={isOpen}
          className={cn('self-center hover:bg-foreground/10', !isOpen && '-mt-3')}
          size="xs"
          type="button"
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? collapseLabel : expandLabel}
        </Button>
      ) : null}
    </>
  );
}
