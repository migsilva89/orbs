import { EXPRESSIONS } from '@repo/avatar-blobs/expressions';
import { BODIES, COLORS } from '@repo/avatar-blobs/skins';
import { AVATAR_BODY_LABELS, AVATAR_COLOR_LABELS, AVATAR_EXPRESSION_LABELS, BOT, botAvatarColor, botAvatarRecolor } from '@repo/client/client';
import { useBotAvatarPick } from '@repo/client/native';
import { m } from '@repo/i18n/client';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, ImageUp, Smile } from 'lucide-react-native';
import { AccessibilityInfo, Pressable, View } from 'react-native';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { BotAvatar } from '@repo/client/client';
import type { Href } from 'expo-router';

interface BotAvatarPickerProps {
  name: string;
  value: BotAvatar;
  emojiRoute: Href;
  isDisabled?: boolean;
  onChange: (avatar: BotAvatar) => void;
}

export function BotAvatarPicker({ name, value, emojiRoute, isDisabled = false, onChange }: BotAvatarPickerProps) {
  function cycle<T extends { id: string }>(items: readonly T[], currentId: string, step: number): T {
    const index = items.findIndex((item) => item.id === currentId);

    return items[(index + step + items.length) % items.length] ?? items[0];
  }

  const router = useRouter();
  const blob = value?.kind === 'blob' ? value : BOT.defaultAvatar;
  const color = botAvatarColor({ avatar: value });
  const photo = useBotAvatarPick();

  const change = (label: string, next: BotAvatar) => {
    AccessibilityInfo.announceForAccessibility(label);
    onChange(next);
  };

  const shiftBody = (step: number) => {
    const body = cycle(BODIES, blob.body, step);
    change(AVATAR_BODY_LABELS[body.id](), { ...blob, body: body.id });
  };

  const shiftMood = () => {
    const expression = cycle(EXPRESSIONS, blob.expression, 1);
    change(AVATAR_EXPRESSION_LABELS[expression.id](), { ...blob, expression: expression.id });
  };

  return (
    <View className="items-center gap-4">
      <View className="flex-row items-center gap-4">
        <Button
          accessibilityLabel={m.avatars_body_previous()}
          disabled={isDisabled}
          size="icon-sm"
          variant="ghost"
          onPress={() => shiftBody(-1)}
        >
          <Icon icon={ChevronLeft} tone="muted" />
        </Button>
        <Pressable
          accessibilityLabel={m.avatars_mood_next()}
          accessibilityRole="button"
          className="rounded-full active:opacity-80 disabled:opacity-50"
          disabled={isDisabled}
          onPress={shiftMood}
        >
          <Avatar
            animate
            avatar={value}
            name={name}
            size="featured"
          />
        </Pressable>
        <Button
          accessibilityLabel={m.avatars_body_next()}
          disabled={isDisabled}
          size="icon-sm"
          variant="ghost"
          onPress={() => shiftBody(1)}
        >
          <Icon icon={ChevronRight} tone="muted" />
        </Button>
      </View>
      <View accessibilityLabel={m.avatars_color()} className="flex-row justify-center">
        {COLORS.map(({ id, hex }) => (
          <Pressable
            accessibilityLabel={AVATAR_COLOR_LABELS[id]()}
            accessibilityRole="radio"
            accessibilityState={{ selected: color === id, disabled: isDisabled }}
            className={color === id ? 'size-6.5 items-center justify-center rounded-full border-2 border-foreground' : 'size-6.5 items-center justify-center'}
            disabled={isDisabled}
            key={id}
            onPress={() => change(AVATAR_COLOR_LABELS[id](), botAvatarRecolor({ avatar: value, color: id }))}
          >
            <View className="size-4.5 rounded-full border border-border" style={{ backgroundColor: hex }} />
          </Pressable>
        ))}
      </View>
      <View className="flex-row gap-1">
        <Button
          disabled={isDisabled || photo.isPending}
          size="sm"
          variant="ghost"
          onPress={() => void photo.pick().then((avatar) => avatar && onChange(avatar), () => undefined)}
        >
          <Icon icon={ImageUp} size="sm" />
          {m.avatars_upload()}
        </Button>
        <Button
          disabled={isDisabled}
          size="sm"
          variant="ghost"
          onPress={() => router.push(emojiRoute)}
        >
          <Icon icon={Smile} size="sm" />
          {m.avatars_emoji()}
        </Button>
      </View>
    </View>
  );
}
