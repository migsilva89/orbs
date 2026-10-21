import { m } from '@openbots/i18n/client';
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
          className="flex h-5.5 min-w-5.5 items-center justify-center gap-0.5 rounded-full bg-background px-1 text-xxs shadow-xs ring-2 ring-background transition-colors enabled:hover:bg-accent disabled:cursor-default"
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
