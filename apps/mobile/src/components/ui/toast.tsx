import { m } from '@openbots/i18n/client';
import { Bell, CircleAlert } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { match } from 'ts-pattern';
import { GlassSurface } from './glass-surface';
import { Icon } from './icon';
import { Text } from './text';
import type { ToastVariant } from '@/types/toast.types';

interface ToastProps {
  message: string;
  variant: ToastVariant;
  onHide: () => void;
}

/** The app-wide toast, above every screen so it clears the floating headers. */
export function Toast({ message, variant, onHide }: ToastProps) {
  const insets = useSafeAreaInsets();

  const look = match(variant)
    .with('error', () => ({ icon: CircleAlert, tone: 'destructive' as const }))
    .otherwise(() => ({ icon: Bell, tone: 'default' as const }));

  return (
    <Animated.View
      className="absolute inset-x-4"
      entering={FadeInUp}
      exiting={FadeOutUp}
      pointerEvents="box-none"
      style={{ top: insets.top + 8 }}
    >
      <Pressable accessibilityLiveRegion="polite" accessibilityRole="alert" onPress={onHide}>
        <GlassSurface className="min-h-14 flex-row items-center gap-3 py-2.5 pr-2.5 pl-3" shape="field">
          <View className="size-9 items-center justify-center rounded-xl bg-muted">
            <Icon icon={look.icon} size="action" tone={look.tone} />
          </View>
          <Text className="flex-1" numberOfLines={3} variant="item-title">{message}</Text>
          <View className="rounded-full bg-muted px-3 py-1.5">
            <Text variant="button-small">{m.mobile_toast_close()}</Text>
          </View>
        </GlassSurface>
      </Pressable>
    </Animated.View>
  );
}
