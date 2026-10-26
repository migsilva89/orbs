import { m } from '@repo/i18n/client';
import { useEffect, useState } from 'react';
import { AvatarBlob } from '@/components/avatars/avatar-blob';
import { OnboardingScene, OnboardingSceneBubble } from '@/components/onboarding/onboarding-scene';
import { cn } from '@/lib/cn';
import IconCheck from '~icons/lucide/check';
import IconHand from '~icons/lucide/hand';
import type { ExpressionId } from '@repo/avatar-blobs/expressions';
import type { StateId } from '@repo/avatar-blobs/states';

interface OnboardingSceneApprovalsCall {
  command: string
  isAllowed: boolean
  line: (() => string) | null
  expression: ExpressionId
  state: StateId
}

const CALLS: OnboardingSceneApprovalsCall[] = [
  { command: 'read README.md', isAllowed: true, line: null, expression: 'happy', state: 'idle' },
  { command: 'npm test', isAllowed: false, line: m.onboarding_scene_ask_line, expression: 'curious', state: 'notify' },
  { command: 'rm -rf build', isAllowed: false, line: m.onboarding_scene_risky_line, expression: 'scared', state: 'wide' },
];

const BEAT_MS = 2600;

export function OnboardingSceneApprovals() {
  const [active, setActive] = useState(1);
  const call = CALLS[active];

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const timer = setInterval(() => setActive((current) => (current + 1) % CALLS.length), BEAT_MS);

    return () => clearInterval(timer);
  }, []);

  return (
    <OnboardingScene>
      <ul className="absolute inset-x-10 top-[16%] m-0 flex list-none flex-col gap-2 p-0">
        {CALLS.map((item, index) => (
          <li
            className={cn(
              'flex items-center gap-3 rounded-xl border bg-background px-3 py-2.5 shadow-sm transition duration-300',
              index === active ? 'scale-100 opacity-100' : 'scale-95 opacity-50',
            )}
            key={item.command}
          >
            <code className="flex-1 truncate font-mono text-xs">{item.command}</code>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {item.isAllowed ? <IconCheck className="size-3.5 text-success" /> : <IconHand className="size-3.5 text-warning" />}
              {item.isAllowed ? m.onboarding_scene_allowed() : m.onboarding_scene_asks()}
            </span>
          </li>
        ))}
      </ul>
      <div className="absolute bottom-[16%] left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
        {call.line ? <OnboardingSceneBubble key={active}>{call.line()}</OnboardingSceneBubble> : null}
        <AvatarBlob
          body="droplet"
          color="turquoise"
          expression={call.expression}
          size={128}
          state={call.state}
        />
      </div>
    </OnboardingScene>
  );
}
