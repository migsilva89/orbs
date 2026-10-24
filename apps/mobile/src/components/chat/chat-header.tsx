import { m } from '@repo/i18n/client';
import { useRouter } from 'expo-router';
import { ChevronLeft, Ellipsis } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { BotActionsMenu } from '@/components/bots/bot-actions-menu';
import { Avatar } from '@/components/ui/avatar';
import { FloatingBar } from '@/components/ui/floating-bar';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassSurface } from '@/components/ui/glass-surface';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Bot } from '@repo/contracts/universal';

interface ChatHeaderProps {
  bot: Bot;
}

export function ChatHeader({ bot }: ChatHeaderProps) {
  const router = useRouter();
  const openDetails = () => router.push({ pathname: '/bots/[botId]/details', params: { botId: bot.id } });

  return (
    <FloatingBar edge="top">
      <GlassButton accessibilityLabel={m.mobile_chat_back()} onPress={() => router.back()}>
        <Icon icon={ChevronLeft} size="action" />
      </GlassButton>
      <BotActionsMenu botId={bot.id} mode="longPress">
        <GlassSurface interactive className="h-11 shrink">
          <Pressable
            accessibilityLabel={m.rooms_details_more()}
            accessibilityRole="button"
            className="flex-1 flex-row items-center gap-2 pr-4 pl-1.5"
            onPress={openDetails}
          >
            <Avatar
              avatar={bot.avatar}
              name={bot.name}
              size="sm"
            />
            <Text
              className="shrink"
              numberOfLines={1}
              variant="chat-title"
            >
              {bot.name}
            </Text>
          </Pressable>
        </GlassSurface>
      </BotActionsMenu>
      <GlassButton accessibilityLabel={m.rooms_details_more()} onPress={openDetails}>
        <Icon icon={Ellipsis} size="action" />
      </GlassButton>
    </FloatingBar>
  );
}
