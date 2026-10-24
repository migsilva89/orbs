import { useNavigation } from 'expo-router';
import { EmojiGrid } from '@/components/ui/emoji-grid';
import type { BotAvatarFormRoute, BotAvatarRouteParams } from '@/types/bot-avatar.types';
import type { NativeStackNavigationProp } from 'expo-router';

interface BotAvatarEmojiScreenProps {
  returnTo: BotAvatarFormRoute;
}

export function BotAvatarEmojiScreen({ returnTo }: BotAvatarEmojiScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, BotAvatarRouteParams>>>();

  return (
    <EmojiGrid
      label={(emoji) => emoji}
      onPick={(emoji) => navigation.popTo(returnTo, { avatarEmoji: emoji }, { merge: true })}
    />
  );
}
