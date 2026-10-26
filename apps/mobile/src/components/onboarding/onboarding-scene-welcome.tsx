import { m } from '@repo/i18n/client';
import { View } from 'react-native';
import { OnboardingScene, OnboardingSceneBubble } from '@/components/onboarding/onboarding-scene';
import { Avatar } from '@/components/ui/avatar';

export function OnboardingSceneWelcome() {
  return (
    <OnboardingScene>
      <View className="flex-row items-end gap-4">
        <Avatar
          avatar={{
            kind: 'blob',
            body: 'squircle',
            color: 'amber',
            expression: 'curious',
          }}
          className="mb-2"
          name=""
        />
        <View className="items-center gap-2">
          <OnboardingSceneBubble>{m.onboarding_scene_welcome()}</OnboardingSceneBubble>
          <Avatar
            animate
            avatar={{
              kind: 'blob',
              body: 'circle',
              color: 'blue',
              expression: 'excited',
            }}
            name=""
            size="featured"
          />
        </View>
        <Avatar
          avatar={{
            kind: 'blob',
            body: 'cloud',
            color: 'pink',
            expression: 'sleepy',
          }}
          className="mb-1"
          name=""
        />
      </View>
    </OnboardingScene>
  );
}
