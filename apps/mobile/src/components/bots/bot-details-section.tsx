import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';

interface BotDetailsSectionProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
}

export function BotDetailsSection({ title, icon, children }: BotDetailsSectionProps) {
  return (
    <View accessibilityLabel={title} className="gap-1.5">
      <View className="flex-row items-center gap-1.5 px-3">
        {icon ? (
          <Icon
            icon={icon}
            size="sm"
            tone="muted"
          />
        ) : null}
        <Text tone="muted" variant="small">{title}</Text>
      </View>
      {children}
    </View>
  );
}
