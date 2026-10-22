import type { ReactNode } from 'react';

interface PreviewCardProps {
  icon: ReactNode
  title: string
  kind: string
  label: string
  children: ReactNode
  onOpen: () => void
}

/** A live preview inside the transcript, cut to a fixed height with a fade, named in a footer; the whole card opens it. */
export function PreviewCard({ icon, title, kind, label, children, onOpen }: PreviewCardProps) {
  return (
    <div data-message-wide className="relative flex w-full min-w-0 flex-col self-start overflow-hidden rounded-2xl border bg-card text-card-foreground transition-colors has-[>button:hover]:bg-accent/40">
      {/* The fade starts at a fixed depth, so a preview shorter than the card stays fully visible. */}
      <div inert className="pointer-events-none max-h-80 w-full overflow-hidden bg-background mask-[linear-gradient(to_bottom,#000_15rem,transparent_20rem)] p-4">
        {children}
      </div>
      <div className="flex w-full items-center gap-3 border-t px-4 py-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-5">{icon}</span>
        <span className="grid min-w-0 gap-0.5">
          <span className="truncate text-sm font-medium">{title}</span>
          <span className="text-xs text-muted-foreground">{kind}</span>
        </span>
      </div>
      <button aria-label={label} className="absolute inset-0 cursor-pointer rounded-2xl" type="button" onClick={onOpen} />
    </div>
  );
}
