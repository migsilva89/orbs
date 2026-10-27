import { cva } from 'cva';
import { cn } from '../lib/cn';
import type { ComponentProps } from 'react';

const buttonGroupVariants = cva({
  base: [
    'flex w-fit min-w-0 items-stretch *:rounded-md has-[>[data-slot=button-group]]:gap-2 [&>*]:focus-visible:relative [&>*]:focus-visible:z-10',
    'has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md [&>[data-slot=select-trigger]:not([class*=\'w-\'])]:w-fit [&>input]:flex-1',
    '[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none',
  ],
});

export function ButtonGroup({ className, ...props }: ComponentProps<'fieldset'>) {
  return (
    <fieldset
      className={cn(buttonGroupVariants(), className)}
      data-slot="button-group"
      {...props}
    />
  );
}
