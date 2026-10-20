import { m } from '@openbots/i18n/client';
import { Maximize2, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, View } from 'react-native';
import { Button } from './button';
import { Card } from './card';
import { Icon } from './icon';
import { Screen } from './screen';
import { Text } from './text';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';

interface PreviewCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  /** The same content, laid out to fill the screen when expanded. */
  expanded: ReactNode;
}

/** A titled live preview inside the transcript, expandable to a full-screen sheet. */
export function PreviewCard({ icon, title, description, children, expanded }: PreviewCardProps) {
  const [isExpanded, setExpanded] = useState(false);

  return (
    <Card className="w-full overflow-hidden">
      <View className="flex-row items-center gap-2 border-b border-border px-3 py-2">
        <Icon icon={icon} tone="muted" />
        <View className="flex-1">
          <Text numberOfLines={1} variant="item-title">{title}</Text>
          {description ? <Text tone="muted" variant="small">{description}</Text> : null}
        </View>
        <Button accessibilityLabel={m.artifacts_expand()} size="icon-xs" variant="ghost" onPress={() => setExpanded(true)}>
          <Icon icon={Maximize2} size="sm" />
        </Button>
      </View>
      {children}
      <Modal animationType="slide" presentationStyle="pageSheet" visible={isExpanded} onRequestClose={() => setExpanded(false)}>
        <Screen padding="none" scroll={false}>
          <View className="flex-row items-center gap-2 px-4 py-3">
            <Text className="flex-1" numberOfLines={1} variant="item-title">{title}</Text>
            <Button accessibilityLabel={m.rooms_start_close()} size="icon-sm" variant="ghost" onPress={() => setExpanded(false)}>
              <Icon icon={X} />
            </Button>
          </View>
          <View className="flex-1">{expanded}</View>
        </Screen>
      </Modal>
    </Card>
  );
}
