import { cva } from 'cva';
import { messageSurface, messageTile } from '@/components/ui/ai/message';
import { cn } from '@/lib/cn';
import type { VariantProps } from 'cva';
import type { ReactNode } from 'react';

const previewCardContentVariants = cva({
  base: 'pointer-events-none max-h-80 w-full overflow-hidden bg-background mask-[linear-gradient(to_bottom,#000_15rem,transparent_20rem)]',
  variants: {
    content: {
      padded: 'p-4',
      // A page brings its own background and margins, so it fills the preview to the edges.
      page: '',
    },
  },
  defaultVariants: { content: 'padded' },
});

interface PreviewCardProps extends VariantProps<typeof previewCardContentVariants> {
  icon: ReactNode
  title: string
  kind: string
  label: string
  children: ReactNode
  onOpen: () => void
}

/** A live preview inside the transcript, cut to a fixed height with a fade, named in a footer; the whole card opens it. */
export function PreviewCard({ icon, title, kind, label, content, children, onOpen }: PreviewCardProps) {
  return (
    <div data-message-wide className={cn(messageSurface, 'relative flex w-full min-w-0 flex-col self-start overflow-hidden in-data-[slot=message-content]:rounded-xl')}>
      {/* The fade starts at a fixed depth, so a preview shorter than the card stays fully visible. */}
      <div inert className={previewCardContentVariants({ content })}>
        {children}
      </div>
      <div className="flex w-full items-center gap-3 border-t px-4 py-3">
        <span className={messageTile}>{icon}</span>
        <span className="grid min-w-0 gap-0.5">
          <span className="truncate text-sm font-medium">{title}</span>
          <span className="text-xs text-muted-foreground">{kind}</span>
        </span>
      </div>
      <button aria-label={label} className="absolute inset-0 cursor-pointer rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset" type="button" onClick={onOpen} />
    </div>
  );
}
