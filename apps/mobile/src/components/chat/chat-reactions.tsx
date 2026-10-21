import { m } from '@openbots/i18n/client';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
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
    <View className={cn('z-10 -mt-1.5 flex-row flex-wrap gap-1 px-5', align === 'end' && 'justify-end')}>
      {groups.map((group) => (
        <Pressable
          accessibilityLabel={m.rooms_reaction_chip({ emoji: group.emoji, names: group.names.join(', ') })}
          accessibilityRole="button"
          accessibilityState={{ selected: group.isMine }}
          className={cn(
            'h-[26px] min-w-8 flex-row items-center justify-center gap-0.5 rounded-full border-2 border-background px-1.5 active:opacity-70',
            group.isMine ? 'bg-blue/40' : 'bg-secondary',
          )}
          disabled={disabled || !onToggle}
          key={group.emoji}
          onPress={() => onToggle?.(group.emoji)}
        >
          <Text variant="reaction-emoji">{group.emoji}</Text>
          {group.count > 1 ? <Text variant="reaction-count">{group.count}</Text> : null}
        </Pressable>
      ))}
      {failed ? <Text tone="destructive" variant="small">{m.rooms_reaction_failed()}</Text> : null}
    </View>
  );
}
