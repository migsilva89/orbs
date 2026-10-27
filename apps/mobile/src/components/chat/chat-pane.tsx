import { m } from '@repo/i18n/client';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { View } from 'react-native';
import { FloatingBar } from '@/components/ui/floating-bar';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassSurface } from '@/components/ui/glass-surface';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { ReactNode } from 'react';

interface ChatPaneHeaderProps {
  children: ReactNode;
}

export function ChatPaneHeader({ children }: ChatPaneHeaderProps) {
  const router = useRouter();

  return (
    <FloatingBar edge="top">
      <GlassButton accessibilityLabel={m.mobile_chat_back()} onPress={() => router.back()}>
        <Icon icon={ChevronLeft} size="action" />
      </GlassButton>
      <GlassSurface className="h-11 shrink">{children}</GlassSurface>
      <View className="size-11" />
    </FloatingBar>
  );
}

interface ChatPaneTitleProps {
  children: string;
}

export function ChatPaneTitle({ children }: ChatPaneTitleProps) {
  return (
    <View className="flex-1 justify-center px-4">
      <Text numberOfLines={1} variant="chat-title">{children}</Text>
    </View>
  );
}

interface ChatPaneCloseProps {
  label?: string;
}

export function ChatPaneClose({ label = m.ui_close() }: ChatPaneCloseProps) {
  const router = useRouter();

  return (
    <FloatingBar className="justify-center" edge="bottom">
      <GlassButton
        accessibilityLabel={label}
        size="pill"
        onPress={() => router.back()}
      >
        <Text variant="button">{label}</Text>
      </GlassButton>
    </FloatingBar>
  );
}
