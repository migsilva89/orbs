import { cva } from 'cva';
import { cn } from '@/lib/cn';
import type { VariantProps } from 'cva';
import type { ComponentProps } from 'react';

const mentionVariants = cva({
  // Icon and text in the surrounding colour, with a faint tint only on hover or when picked in the editor. The
  // negative margin keeps the pill inside its line, so it never makes the line taller; -0.125em centres it on the text, where middle sat it low.
  base: '-my-1 inline-flex max-w-full items-center gap-1 rounded-md px-1 py-px align-[-0.125em] text-sm leading-4 font-medium whitespace-nowrap transition-colors hover:bg-current/10 data-[selected=true]:bg-current/10',
  variants: {
    variant: {
      default: '',
      // The one kind with a colour of its own, on its icon only, so the text reads on any bubble.
      skill: '[&>svg]:text-skill',
      muted: 'text-muted-foreground',
      // Chat event lines: the named thing reads a step brighter than the muted sentence around it.
      plain: 'font-normal text-foreground/80',
    },
  },
  defaultVariants: { variant: 'default' },
});

/** An inline pill naming a thing a message points at: a bot, a quote, a skill, or a command. */
function Mention({ className, variant, ...props }: ComponentProps<'span'> & VariantProps<typeof mentionVariants>) {
  return <span className={cn(mentionVariants({ variant }), className)} data-slot="mention" {...props} />;
}

export { Mention };
