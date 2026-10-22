import { m } from '@repo/i18n/client';
import { cva } from 'cva';
import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import IconLucideChevronDown from '~icons/lucide/chevron-down';
import { Button } from './button';
import type { VariantProps } from 'cva';
import type { ComponentProps } from 'react';

const clampVariants = cva({
  base: 'min-w-0 wrap-break-word whitespace-pre-line',
  variants: {
    size: {
      sm: 'line-clamp-3',
      default: 'line-clamp-6',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export function Clamp({ size, className, children, ...props }: ComponentProps<'div'> & VariantProps<typeof clampVariants>) {
  const text = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [clamped, setClamped] = useState(false);

  useLayoutEffect(() => {
    const node = text.current;

    if (!node) {
      return undefined;
    }

    const observer = new ResizeObserver(() => setClamped(node.scrollHeight > node.clientHeight + 1));
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn('flex min-w-0 flex-col items-start gap-0.5', className)} data-slot="clamp" {...props}>
      <div className={cn(clampVariants({ size }), open && 'line-clamp-none')} ref={text}>{children}</div>
      {open || clamped ? (
        <Button
          aria-expanded={open}
          size="inline"
          variant="link-muted"
          onClick={() => setOpen(!open)}
        >
          {open ? m.ui_show_less() : m.ui_show_more()}
          <IconLucideChevronDown className={cn('size-3', open && 'rotate-180')} />
        </Button>
      ) : null}
    </div>
  );
}
