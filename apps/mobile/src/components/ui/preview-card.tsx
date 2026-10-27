import { cva } from 'cva';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';
import { Icon } from './icon';
import { messageSurface, messageTile } from './message';
import { Text } from './text';
import type { VariantProps } from 'cva';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';

const PREVIEW_CARD = { maxHeight: 320, fadeHeight: 80 };

const previewCardContentVariants = cva({
  base: 'shrink-0',
  variants: {
    content: {
      padded: 'p-4',
      // A page brings its own background and margins, so it fills the preview to the edges.
      page: '',
    },
  },
  defaultVariants: { content: 'padded' },
});

interface PreviewCardProps extends VariantProps<typeof previewCardContentVariants> {
  icon: LucideIcon;
  title: string;
  kind: string;
  label: string;
  children: ReactNode;
  onOpen: () => void;
}

/** A live preview inside the transcript, cut to a fixed height with a fade, named in a footer; the whole card opens it. */
export function PreviewCard({ icon, title, kind, label, content, children, onOpen }: PreviewCardProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className={cn(messageSurface, 'w-full overflow-hidden active:opacity-80')}
      style={{ borderCurve: 'continuous' }}
      onPress={onOpen}
    >
      <View className="overflow-hidden bg-background" pointerEvents="none" style={{ maxHeight: PREVIEW_CARD.maxHeight }}>
        {/* Sized by its content, so the outer view clips it instead of shrinking it. */}
        <View className={previewCardContentVariants({ content })}>{children}</View>
        {/* Pinned at a fixed depth, so a preview shorter than the card is clipped clear of the fade. */}
        <View
          className="absolute inset-x-0 bg-linear-to-b from-background/0 to-background"
          style={{ top: PREVIEW_CARD.maxHeight - PREVIEW_CARD.fadeHeight, height: PREVIEW_CARD.fadeHeight }}
        />
      </View>
      <View className="flex-row items-center gap-3 border-t border-border px-4 py-3">
        <View className={messageTile}>
          <Icon icon={icon} tone="muted" />
        </View>
        <View className="flex-1">
          <Text numberOfLines={1} variant="item-title">{title}</Text>
          <Text tone="muted" variant="small">{kind}</Text>
        </View>
      </View>
    </Pressable>
  );
}
