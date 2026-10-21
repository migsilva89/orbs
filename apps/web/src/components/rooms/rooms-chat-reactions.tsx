import { m } from '@openbots/i18n/client';
import { cn } from '@/lib/cn';
import type { RoomsReactionGroup } from '@openbots/client/client';

interface RoomsChatReactionsProps {
  groups: RoomsReactionGroup[]
  disabled?: boolean
  onToggle?: (emoji: string) => void
}

export function RoomsChatReactions({ groups, disabled = false, onToggle }: RoomsChatReactionsProps) {
  return (
    <div className="flex items-center gap-1">
      {groups.map((group) => (
        <button
          aria-label={m.rooms_reaction_chip({ emoji: group.emoji, names: group.names.join(', ') })}
          aria-pressed={group.isMine}
          className={cn(
            'flex h-7 min-w-7 items-center justify-center gap-0.5 rounded-full border bg-background px-1.5 text-xs shadow-xs transition-colors enabled:hover:bg-accent disabled:cursor-default',
            group.isMine && 'border-blue-500/40 bg-blue-500/15',
          )}
          disabled={disabled || !onToggle}
          key={group.emoji}
          title={group.names.join(', ')}
          type="button"
          onClick={() => onToggle?.(group.emoji)}
        >
          {group.emoji}
          {group.count > 1 ? <span className="text-xxs font-medium tabular-nums">{group.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
