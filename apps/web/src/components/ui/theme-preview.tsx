import { cva } from 'cva';
import { cn } from '@/lib/cn';
import type { ComponentProps } from 'react';

const themePreviewVariants = cva({ base: 'overflow-hidden rounded-lg border border-border bg-background text-foreground' });

const themePreviewHeaderVariants = cva({
  base: 'flex items-center gap-2 border-b border-border bg-sidebar px-4 py-3 text-sm font-medium text-sidebar-foreground',
});

const themePreviewContentVariants = cva({ base: 'flex flex-col gap-3 p-4 text-sm' });

const themePreviewMessageVariants = cva({
  base: 'max-w-4/5 rounded-2xl px-3 py-2',
  variants: {
    variant: {
      default: 'self-end bg-primary text-primary-foreground',
      secondary: 'self-start bg-secondary text-secondary-foreground',
    },
  },
});

interface ThemePreviewProps extends ComponentProps<'div'> {
  title: string;
  message: string;
  reply: string;
}

export function ThemePreview({ title, message, reply, className, ...props }: ThemePreviewProps) {
  return (
    <div className={cn(themePreviewVariants(), className)} {...props}>
      <div className={themePreviewHeaderVariants()}>
        {title}
      </div>
      <div className={themePreviewContentVariants()}>
        <div className={themePreviewMessageVariants({ variant: 'default' })}>{message}</div>
        <div className={themePreviewMessageVariants({ variant: 'secondary' })}>{reply}</div>
      </div>
    </div>
  );
}
