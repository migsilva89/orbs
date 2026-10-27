import { m } from '@repo/i18n/client';
import { AvatarBlob } from '../avatars/avatar-blob';
import { OnboardingScene, OnboardingSceneBubble } from './onboarding-scene';

export function OnboardingSceneWelcome() {
  return (
    <OnboardingScene screenshot="welcome">
      <div className="absolute inset-x-10 bottom-10 flex items-end justify-center gap-6">
        <div className="motion-safe:animate-scene-float" style={{ animationDelay: '1.2s' }}>
          <AvatarBlob
            body="squircle"
            color="amber"
            expression="curious"
            size={96}
            state="wide"
          />
        </div>
        <div className="flex flex-col items-center gap-1 motion-safe:animate-scene-float">
          <OnboardingSceneBubble>{m.onboarding_scene_welcome()}</OnboardingSceneBubble>
          <AvatarBlob
            body="circle"
            color="blue"
            expression="excited"
            size={124}
            state="wink"
          />
        </div>
        <AvatarBlob
          body="cloud"
          color="pink"
          expression="sleepy"
          size={84}
          state="idle"
        />
      </div>
    </OnboardingScene>
  );
}
