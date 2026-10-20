import { m } from '@openbots/i18n/client';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { RoomsReactionGroup } from '@openbots/client/client';

interface ChatReactionsProps {
  groups: RoomsReactionGroup[];
  align: 'start' | 'end';
  disabled?: boolean;
  failed?: boolean;
  onToggle?: (emoji: string) => void;
}

export function ChatReactions({ groups, align, disabled = false, failed = false, onToggle }: ChatReactionsProps) {
  if (groups.length === 0 && !failed) {
    return null;
  }

  return (
    <View className={align === 'end' ? 'flex-row flex-wrap justify-end gap-1 px-4' : 'flex-row flex-wrap gap-1 px-14'}>
      {groups.map((group) => (
        <Button
          accessibilityLabel={m.rooms_reaction_chip({ emoji: group.emoji, names: group.names.join(', ') })}
          accessibilityState={{ selected: group.isMine }}
          disabled={disabled || !onToggle}
          key={group.emoji}
          size="xs"
          variant={group.isMine ? 'secondary' : 'outline'}
          onPress={() => onToggle?.(group.emoji)}
        >
          {`${group.emoji} ${group.count}`}
        </Button>
      ))}
      {failed ? <Text tone="destructive" variant="small">{m.rooms_reaction_failed()}</Text> : null}
    </View>
  );
}
