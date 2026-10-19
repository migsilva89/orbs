import { Command as CommandPrimitive } from 'cmdk';
import { cva } from 'cva';
import { cn } from '@/lib/cn';
import IconSearch from '~icons/lucide/search';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog';
import type { VariantProps } from 'cva';
import type { ComponentProps, ReactNode } from 'react';

const commandVariants = cva({
  base: 'flex size-full flex-col overflow-hidden',
  variants: {
    variant: {
      default: 'rounded-md bg-popover text-popover-foreground',
      ghost: 'bg-transparent text-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

function Command({ className, variant, ...props }: ComponentProps<typeof CommandPrimitive> & VariantProps<typeof commandVariants>) {
  return (
    <CommandPrimitive
      className={cn(commandVariants({ variant }), className)}
      data-slot="command"
      {...props}
    />
  );
}

function CommandInput({ className, start, ...props }: ComponentProps<typeof CommandPrimitive.Input> & { start?: ReactNode }) {
  return (
    <div className="flex h-9 items-center gap-2 border-b px-3" data-slot="command-input-wrapper">
      <IconSearch className="size-4 shrink-0 opacity-50" />
      {start}
      <CommandPrimitive.Input
        data-1p-ignore
        autoComplete="off"
        className={cn('flex h-9 w-full bg-transparent text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50', className)}
        data-slot="command-input"
        {...props}
      />
    </div>
  );
}

function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return <CommandPrimitive.List className={cn('max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-hidden', className)} data-slot="command-list" {...props} />;
}

function CommandEmpty(props: ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground" data-slot="command-empty" {...props} />;
}

function CommandGroup({ className, ...props }: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        'overflow-hidden p-1 text-foreground',
        '**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground',
        className,
      )}
      data-slot="command-group"
      {...props}
    />
  );
}

function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        'relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none',
        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-slot="command-item"
      {...props}
    />
  );
}

function CommandDialog({
  title,
  description,
  shouldFilter,
  children,
  ...props
}: ComponentProps<typeof Dialog> & Pick<ComponentProps<typeof CommandPrimitive>, 'shouldFilter'> & {
  title: string
  description: string
}) {
  return (
    <Dialog {...props}>
      <DialogContent className="mt-[12vh] max-w-2xl gap-0 self-start overflow-hidden p-0" close={false}>
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <Command
          className={cn(
            '**:data-[slot=command-input]:h-12 **:data-[slot=command-input]:text-base **:data-[slot=command-input-wrapper]:h-12',
            '**:data-[slot=command-item]:px-3 **:data-[slot=command-item]:py-2 **:data-[slot=command-list]:max-h-[min(32rem,60vh)]',
          )}
          shouldFilter={shouldFilter}
        >
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem };
