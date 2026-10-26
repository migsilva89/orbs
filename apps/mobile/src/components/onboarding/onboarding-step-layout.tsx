import { onboardingStep } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { OnboardingStep } from '@repo/contracts/universal';
import type { ReactNode } from 'react';

interface OnboardingStepLayoutProps {
  step: OnboardingStep;
  title: string;
  description: string;
  hasBack?: boolean;
  primary: ReactNode;
  secondary?: ReactNode;
  scene: ReactNode;
  children?: ReactNode;
}

export function OnboardingStepLayout({ step, title, description, hasBack = false, primary, secondary, scene, children }: OnboardingStepLayoutProps) {
  const router = useRouter();
  const steps = onboardingStep.options;
  const current = steps.indexOf(step);

  return (
    <Screen
      keyboard
      padding="none"
      scroll={false}
    >
      <View className="h-10 flex-row items-center gap-3 px-4">
        {hasBack ? (
          <Button
            accessibilityLabel={m.onboarding_back()}
            size="icon-sm"
            variant="ghost"
            onPress={() => router.back()}
          >
            <Icon icon={ArrowLeft} />
          </Button>
        ) : <View className="size-8" />}
        <View
          accessible
          accessibilityLabel={m.onboarding_progress({ current: current + 1, total: steps.length })}
          className="flex-1 flex-row justify-center gap-1.5"
        >
          {steps.map((key, index) => (
            <View
              className={cn('h-1.5 w-6 rounded-full', index <= current ? 'bg-foreground' : 'bg-border')}
              key={key}
            />
          ))}
        </View>
        <View className="size-8" />
      </View>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerClassName="gap-6 px-6 pt-2 pb-8"
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        {scene}
        <View className="gap-1.5">
          <Text variant="heading">{title}</Text>
          <Text tone="muted" variant="small">{description}</Text>
        </View>
        {children}
      </ScrollView>
      <View className="gap-2 px-6 pt-2 pb-1">
        {primary}
        {secondary}
      </View>
    </Screen>
  );
}
