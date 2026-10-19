import { m } from '@openbots/i18n/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import type { RoomsReactionGroup } from '@/types/rooms.types';

interface RoomsChatReactionsProps {
  groups: RoomsReactionGroup[]
  disabled?: boolean
  failed?: boolean
  align?: 'start' | 'end'
  onToggle?: (emoji: string) => void
}

export function RoomsChatReactions({ groups, disabled = false, failed = false, align = 'start', onToggle }: RoomsChatReactionsProps) {
  if (groups.length === 0 && !failed) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1 px-11 pb-1', align === 'end' && 'justify-end')}>
      {groups.map((group) => (onToggle ? (
        <Button
          aria-label={m.rooms_reaction_chip({ emoji: group.emoji, names: group.names.join(', ') })}
          aria-pressed={group.isMine}
          disabled={disabled}
          key={group.emoji}
          size="xs"
          title={group.names.join(', ')}
          variant={group.isMine ? 'secondary' : 'outline'}
          onClick={() => onToggle(group.emoji)}
        >
          {group.emoji}
          <span className="tabular-nums">{group.count}</span>
        </Button>
      ) : (
        <Badge
          aria-label={m.rooms_reaction_chip({ emoji: group.emoji, names: group.names.join(', ') })}
          key={group.emoji}
          title={group.names.join(', ')}
          variant="outline"
        >
          {group.emoji}
          <span className="tabular-nums">{group.count}</span>
        </Badge>
      )))}
      {failed ? <p className="text-xxs text-destructive" role="alert">{m.rooms_reaction_failed()}</p> : null}
    </div>
  );
}
