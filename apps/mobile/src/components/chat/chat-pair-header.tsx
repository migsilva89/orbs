import { m } from '@openbots/i18n/client';
import { useRouter } from 'expo-router';
import { ArrowLeftRight, ChevronLeft } from 'lucide-react-native';
import { View } from 'react-native';
import { Avatar } from '@/components/ui/avatar';
import { FloatingBar } from '@/components/ui/floating-bar';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassSurface } from '@/components/ui/glass-surface';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Bot } from '@openbots/contracts/universal';

interface ChatPairHeaderProps {
  asker: Bot;
  peer: Bot;
}

export function ChatPairHeader({ asker, peer }: ChatPairHeaderProps) {
  const router = useRouter();

  return (
    <FloatingBar edge="top">
      <GlassButton accessibilityLabel={m.mobile_chat_back()} onPress={() => router.back()}>
        <Icon icon={ChevronLeft} size="action" />
      </GlassButton>
      <GlassSurface className="h-11 shrink">
        <View className="flex-1 flex-row items-center gap-2 pr-4 pl-1.5">
          <Avatar
            avatar={asker.avatar}
            name={asker.name}
            size="sm"
          />
          <Text
            className="shrink"
            numberOfLines={1}
            variant="chat-title"
          >
            {asker.name}
          </Text>
          <Icon icon={ArrowLeftRight} size="sm" />
          <Avatar
            avatar={peer.avatar}
            name={peer.name}
            size="sm"
          />
          <Text
            className="shrink"
            numberOfLines={1}
            variant="chat-title"
          >
            {peer.name}
          </Text>
        </View>
      </GlassSurface>
      <View className="size-11" />
    </FloatingBar>
  );
}
