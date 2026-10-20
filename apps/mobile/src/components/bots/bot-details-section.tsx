import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { ReactNode } from 'react';

interface BotDetailsSectionProps {
  title: string;
  children: ReactNode;
}

export function BotDetailsSection({ title, children }: BotDetailsSectionProps) {
  return (
    <View accessibilityLabel={title} className="gap-1.5">
      <View className="px-3">
        <Text tone="muted" variant="small">{title}</Text>
      </View>
      {children}
    </View>
  );
}
