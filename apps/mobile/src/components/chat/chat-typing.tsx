import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { CHAT_TYPING } from '@/services/chat/chat.constants';

interface ChatTypingProps {
  label?: string;
  accessibilityLabel: string;
}

export function ChatTyping({ label, accessibilityLabel }: ChatTypingProps) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      className="flex-row items-center gap-3 px-5"
    >
      <View className="h-7 flex-row items-center gap-1 rounded-full bg-secondary px-3">
        {[0, 1, 2].map((index) => (
          <Animated.View
            className="size-1.5 rounded-full bg-muted-foreground"
            key={index}
            style={{ ...CHAT_TYPING.dot, animationDelay: index * CHAT_TYPING.dotDelayMs }}
          />
        ))}
      </View>
      {label ? (
        <Animated.View className="shrink" style={CHAT_TYPING.label}>
          <Text
            numberOfLines={1}
            tone="muted"
            variant="item-description"
          >{label}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
