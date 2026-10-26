import { m } from '@repo/i18n/client';
import { Check, Hand } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { OnboardingScene, OnboardingSceneBubble } from '@/components/onboarding/onboarding-scene';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

const CALLS = [
  { command: 'read README.md', isAllowed: true, line: null, expression: 'happy' },
  { command: 'npm test', isAllowed: false, line: m.onboarding_scene_ask_line, expression: 'curious' },
  { command: 'rm -rf build', isAllowed: false, line: m.onboarding_scene_risky_line, expression: 'scared' },
] as const;

const BEAT_MS = 2600;

export function OnboardingSceneApprovals() {
  const [active, setActive] = useState(1);
  const call = CALLS[active];

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    let isMounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((isReduced) => {
      if (isMounted && !isReduced) {
        timer = setInterval(() => setActive((current) => (current + 1) % CALLS.length), BEAT_MS);
      }
    });

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <OnboardingScene>
      <View className="w-full max-w-72 gap-1.5">
        {CALLS.map((item, index) => (
          <View
            className={cn('flex-row items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2', index !== active && 'opacity-45')}
            key={item.command}
          >
            <Text
              className="flex-1"
              numberOfLines={1}
              variant="trace-code"
            >{item.command}</Text>
            <View className="flex-row items-center gap-1">
              <Icon
                icon={item.isAllowed ? Check : Hand}
                size="sm"
                tone={item.isAllowed ? 'success' : 'muted'}
              />
              <Text tone="muted" variant="caption">{item.isAllowed ? m.onboarding_scene_allowed() : m.onboarding_scene_asks()}</Text>
            </View>
          </View>
        ))}
        <View className="mt-2 flex-row items-center justify-end gap-2">
          {call.line ? <OnboardingSceneBubble>{call.line()}</OnboardingSceneBubble> : null}
          <Avatar
            avatar={{
              kind: 'blob',
              body: 'droplet',
              color: 'turquoise',
              expression: call.expression,
            }}
            name=""
          />
        </View>
      </View>
    </OnboardingScene>
  );
}
