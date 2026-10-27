import { View } from 'react-native';
import { Avatar } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import type { Bot } from '@repo/contracts/universal';

interface BotMentionProps {
  bot: Pick<Bot, 'name'> & Partial<Pick<Bot, 'avatar'>>;
  animate?: boolean;
}

export function BotMention({ bot, animate = false }: BotMentionProps) {
  return (
    <View className="min-w-0 shrink flex-row items-center gap-1">
      <Avatar
        animate={animate}
        avatar={bot.avatar ?? null}
        name={bot.name}
        size="xs"
      />
      <Text className="shrink font-medium" numberOfLines={1}>{bot.name}</Text>
    </View>
  );
}
