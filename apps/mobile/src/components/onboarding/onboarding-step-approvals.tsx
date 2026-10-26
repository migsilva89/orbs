import { BOT_PERMISSION_HINTS, BOT_PERMISSION_LABELS } from '@repo/client/client';
import { useSettingsTools } from '@repo/client/react';
import { botFields } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { OnboardingSceneApprovals } from '@/components/onboarding/onboarding-scene-approvals';
import { OnboardingStepLayout } from '@/components/onboarding/onboarding-step-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LabelDescription } from '@/components/ui/label';
import { Text } from '@/components/ui/text';

export function OnboardingStepApprovals() {
  const router = useRouter();
  const [jevApiKey, setJevApiKey] = useState('');
  const next = () => router.push({ pathname: '/onboarding/[step]', params: { step: 'bot' } });
  const tools = useSettingsTools({ onDone: next });
  const settings = tools.settings.data;
  const isConfigured = settings?.isJevConfigured ?? false;

  return (
    <OnboardingStepLayout
      hasBack
      description={m.onboarding_approvals_description()}
      primary={jevApiKey.trim() && settings ? (
        <Button
          className="w-full"
          disabled={tools.isPending}
          loading={tools.isPending}
          size="lg"
          onPress={() => tools.save({
            approvalRules: settings.approvalRules,
            approvalTimeoutMinutes: settings.approvalTimeoutMinutes,
            jevApiKey,
          })}
        >
          {m.onboarding_approvals_save()}
        </Button>
      ) : (
        <Button
          className="w-full"
          size="lg"
          variant={isConfigured ? 'primary' : 'outline'}
          onPress={next}
        >
          {isConfigured ? m.onboarding_next() : m.onboarding_skip()}
        </Button>
      )}
      scene={<OnboardingSceneApprovals />}
      step="approvals"
      title={m.onboarding_approvals_title()}
    >
      <View className="gap-3">
        {botFields.shape.permission.options.map((option) => (
          <View className="gap-0.5" key={option}>
            <Text variant="label">{BOT_PERMISSION_LABELS[option]()}</Text>
            <Text tone="muted" variant="small">{BOT_PERMISSION_HINTS[option]()}</Text>
          </View>
        ))}
      </View>
      <View className="gap-2">
        <Text variant="label">{m.onboarding_approvals_jev()}</Text>
        <Input
          secureTextEntry
          accessibilityLabel={m.onboarding_approvals_jev()}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!tools.isPending}
          placeholder={isConfigured ? m.settings_secret_saved() : m.settings_tools_jev_placeholder()}
          value={jevApiKey}
          onChangeText={setJevApiKey}
        />
        <LabelDescription>{m.onboarding_approvals_jev_hint()}</LabelDescription>
        {tools.problem ? <LabelDescription accessibilityRole="alert" variant="error">{tools.problem}</LabelDescription> : null}
      </View>
    </OnboardingStepLayout>
  );
}
