import { cn } from '@/lib/cn';
import type { UIMessage } from 'ai';
import type { HTMLAttributes } from 'react';

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
  return <div className={cn('flex w-4/5 min-w-0 flex-col gap-1 group-data-[role=assistant]:items-start group-data-[role=user]:items-end', className)} {...props} />;
}

export function MessageContent({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="w-fit max-w-full min-w-0 has-[[data-message-wide]]:w-full">
      <div
        className={cn(
          'flex flex-col gap-2 overflow-hidden rounded-2xl px-3 py-2 text-sm leading-snug',
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
