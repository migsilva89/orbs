import { BOT_ACTIVITY_LABELS } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Ellipsis } from 'lucide-react-native';
import { View } from 'react-native';
import { Avatar } from '@/components/ui/avatar';
import { FloatingBar } from '@/components/ui/floating-bar';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassSurface } from '@/components/ui/glass-surface';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { NavigationRoot } from '@/types/navigation.types';
import type { ChatActivity } from '@openbots/client/client';
import type { Bot } from '@openbots/contracts/universal';

interface ChatHeaderProps {
  bot: Bot;
  activity: ChatActivity;
}

export function ChatHeader({ bot, activity }: ChatHeaderProps) {
  const navigation = useNavigation<NavigationRoot>();

  return (
    <FloatingBar edge="top">
      <GlassButton accessibilityLabel={m.mobile_chat_back()} onPress={() => navigation.goBack()}>
        <Icon icon={ChevronLeft} size="action" />
      </GlassButton>
      <GlassSurface className="h-11 shrink">
        <View className="flex-1 flex-row items-center gap-2 pr-4 pl-1.5">
          <Avatar
            avatar={bot.avatar}
            name={bot.name}
            size="sm"
          />
          <View className="shrink">
            <Text numberOfLines={1} variant="chat-title">{bot.name}</Text>
            <Text
              numberOfLines={1}
              tone="muted"
              variant="chat-status"
            >
              {BOT_ACTIVITY_LABELS[activity]()}
            </Text>
          </View>
        </View>
      </GlassSurface>
      <GlassButton
        disabled
        accessibilityHint={m.mobile_home_unavailable()}
        accessibilityLabel={m.rooms_details_more()}
      >
        <Icon icon={Ellipsis} size="action" />
      </GlassButton>
    </FloatingBar>
  );
}
