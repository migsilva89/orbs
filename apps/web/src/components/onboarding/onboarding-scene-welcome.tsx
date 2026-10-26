import { m } from '@repo/i18n/client';
import { AvatarBlob } from '@/components/avatars/avatar-blob';
import { OnboardingScene, OnboardingSceneBubble } from '@/components/onboarding/onboarding-scene';
import BrandsLogo from '~icons/brands/logo';

export function OnboardingSceneWelcome() {
  return (
    <OnboardingScene>
      <div className="absolute inset-x-10 top-1/2 -translate-y-1/2">
        <div className="relative aspect-4/3 overflow-hidden rounded-2xl border bg-background/70 shadow-sm">
          <div className="flex h-7 items-center gap-1.5 border-b px-3">
            <span className="size-2 rounded-full bg-muted-foreground/25" />
            <span className="size-2 rounded-full bg-muted-foreground/25" />
            <span className="size-2 rounded-full bg-muted-foreground/25" />
            <span className="ml-auto flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5">
              <BrandsLogo className="size-3" />
              <span className="size-1.5 rounded-full bg-success" />
            </span>
          </div>
          <div className="absolute top-[22%] left-[30%] flex -translate-x-1/2 flex-col items-center gap-1 motion-safe:animate-scene-float">
            <OnboardingSceneBubble>{m.onboarding_scene_welcome()}</OnboardingSceneBubble>
            <AvatarBlob
              body="circle"
              color="blue"
              expression="excited"
              size={120}
              state="wink"
            />
          </div>
          <div className="absolute top-[14%] left-[76%] -translate-x-1/2 motion-safe:animate-scene-float" style={{ animationDelay: '1.2s' }}>
            <AvatarBlob
              body="squircle"
              color="amber"
              expression="curious"
              size={108}
              state="wide"
            />
          </div>
          <div className="absolute bottom-2 left-[68%] -translate-x-1/2">
            <AvatarBlob
              body="cloud"
              color="pink"
              expression="sleepy"
              size={88}
              state="idle"
            />
          </div>
        </div>
        <div className="mx-auto h-8 w-14 border-x bg-background/50" />
        <div className="mx-auto h-1.5 w-32 rounded-full border bg-background/70" />
      </div>
    </OnboardingScene>
  );
}
