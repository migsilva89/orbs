import { BOT_ACTIVITY_LABELS } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { useRouter } from 'expo-router';
import { ChevronLeft, Ellipsis } from 'lucide-react-native';
import { View } from 'react-native';
import { BotActionsMenu } from '@/components/bots/bot-actions-menu';
import { Avatar } from '@/components/ui/avatar';
import { FloatingBar } from '@/components/ui/floating-bar';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassSurface } from '@/components/ui/glass-surface';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { ChatActivity } from '@openbots/client/client';
import type { Bot } from '@openbots/contracts/universal';

interface ChatHeaderProps {
  bot: Bot;
  activity: ChatActivity;
}

export function ChatHeader({ bot, activity }: ChatHeaderProps) {
  const router = useRouter();

  return (
    <FloatingBar edge="top">
      <GlassButton accessibilityLabel={m.mobile_chat_back()} onPress={() => router.back()}>
        <Icon icon={ChevronLeft} size="action" />
      </GlassButton>
      <BotActionsMenu botId={bot.id} mode="longPress">
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
      </BotActionsMenu>
      <GlassButton accessibilityLabel={m.rooms_details_more()} onPress={() => router.push({ pathname: '/bots/[botId]/details', params: { botId: bot.id } })}>
        <Icon icon={Ellipsis} size="action" />
      </GlassButton>
    </FloatingBar>
  );
}
