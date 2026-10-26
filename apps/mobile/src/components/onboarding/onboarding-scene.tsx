import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { ReactNode } from 'react';

interface OnboardingSceneProps {
  children: ReactNode;
}

export function OnboardingScene({ children }: OnboardingSceneProps) {
  return (
    <View
      accessibilityElementsHidden
      className="h-56 items-center justify-center overflow-hidden rounded-2xl bg-muted px-4"
      importantForAccessibility="no-hide-descendants"
    >
      {children}
    </View>
  );
}

interface OnboardingSceneBubbleProps {
  children: ReactNode;
}

export function OnboardingSceneBubble({ children }: OnboardingSceneBubbleProps) {
  return (
    <View className="rounded-2xl border border-border bg-background px-3 py-1.5">
      <Text variant="small">{children}</Text>
    </View>
  );
}
