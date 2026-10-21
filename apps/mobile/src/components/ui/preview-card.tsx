import { m } from '@openbots/i18n/client';
import { Maximize2 } from 'lucide-react-native';
import { View } from 'react-native';
import { Button } from './button';
import { Icon } from './icon';
import { Text } from './text';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';

interface PreviewCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  onExpand: () => void;
}

/** A titled live preview inside the transcript, with a button that opens it full screen. */
export function PreviewCard({ icon, title, description, children, onExpand }: PreviewCardProps) {
  return (
    <View className="w-full overflow-hidden rounded-2xl border border-border bg-card">
      <View className="flex-row items-center gap-2 border-b border-border px-3 py-2">
        <Icon icon={icon} tone="muted" />
        <View className="flex-1">
          <Text numberOfLines={1} variant="item-title">{title}</Text>
          {description ? <Text tone="muted" variant="small">{description}</Text> : null}
        </View>
        <Button accessibilityLabel={m.artifacts_expand()} size="icon-xs" variant="ghost" onPress={onExpand}>
          <Icon icon={Maximize2} size="sm" />
        </Button>
      </View>
      <View className="p-3">{children}</View>
    </View>
  );
}
