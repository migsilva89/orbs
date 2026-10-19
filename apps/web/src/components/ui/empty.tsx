import { cva } from 'cva';
import { Children } from 'react';
import { cn } from '@/lib/cn';
import type { ComponentProps, ReactNode } from 'react';

const emptyVariants = cva({
  base: 'group/empty flex-center min-w-0 flex-1 flex-col gap-6 rounded-lg border-dashed p-6 text-center text-balance',
  variants: { size: { default: 'md:p-12', sm: '' } },
  defaultVariants: { size: 'default' },
});

interface EmptyProps extends ComponentProps<'div'> {
  size?: 'default' | 'sm'
}

function Empty({ className, size = 'default', ...props }: EmptyProps) {
  return (
    <div
      className={cn(emptyVariants({ size }), className)}
      data-size={size}
      data-slot="empty"
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex max-w-sm flex-col items-center gap-2 text-center', className)} data-slot="empty-header" {...props} />;
}

function EmptyTitle({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('text-lg font-medium tracking-tight group-data-[size=sm]/empty:text-sm', className)} data-slot="empty-title" {...props} />;
}

function EmptyDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <div
      className={cn('max-w-md text-center text-sm/relaxed text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary', className)}
      data-slot="empty-description"
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex w-full max-w-sm min-w-0 flex-col items-center gap-2 text-sm text-balance', className)} data-slot="empty-content" {...props} />;
}

const emptyIconBox =
  'bg-background dark:bg-muted size-14 group-data-[size=sm]/empty:size-10 grid place-items-center rounded-xl shadow-lg ring-1 ring-border transition duration-500 group-hover:duration-200 [&_svg]:size-7 group-data-[size=sm]/empty:[&_svg]:size-5 [&_svg]:text-muted-foreground';

function EmptyIcons({ children }: { children: ReactNode }) {
  const icons = Children.toArray(children);

  if (icons.length === 0) {
    return null;
  }

  return (
    <div className="isolate mb-2 flex justify-center">
      {icons.length === 3 ? (
        <>
          <div className={cn(emptyIconBox, 'relative top-1.5 left-3 -rotate-6 group-hover:-translate-x-1 group-hover:-translate-y-0.5 group-hover:-rotate-8')}>
            {icons[0]}
          </div>
          <div className={cn(emptyIconBox, 'relative z-10 group-hover:-translate-y-1')}>{icons[1]}</div>
          <div className={cn(emptyIconBox, 'relative top-1.5 right-3 rotate-6 group-hover:translate-x-1 group-hover:-translate-y-0.5 group-hover:rotate-8')}>
            {icons[2]}
          </div>
        </>
      ) : (
        <div className={cn(emptyIconBox, 'group-hover:-translate-y-1')}>{icons[0]}</div>
      )}
    </div>
  );
}

export { Empty, EmptyHeader, EmptyIcons, EmptyTitle, EmptyDescription, EmptyContent };
