import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { LucideIcon } from 'lucide-react-native';

interface OnboardingStepListProps {
  items: { icon: LucideIcon, label: string }[];
}

export function OnboardingStepList({ items }: OnboardingStepListProps) {
  return (
    <View className="gap-3">
      {items.map(({ icon, label }) => (
        <View className="flex-row items-center gap-3" key={label}>
          <View className="size-9 items-center justify-center rounded-lg border border-border bg-muted">
            <Icon icon={icon} tone="muted" />
          </View>
          <Text className="shrink">{label}</Text>
        </View>
      ))}
    </View>
  );
}
