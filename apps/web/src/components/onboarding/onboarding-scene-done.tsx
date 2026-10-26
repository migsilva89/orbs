import { m } from '@repo/i18n/client';
import { AvatarBlob } from '@/components/avatars/avatar-blob';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { OnboardingScene, OnboardingSceneBubble } from '@/components/onboarding/onboarding-scene';
import type { Bot } from '@repo/contracts/universal';

const CONFETTI = Array.from({ length: 22 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  delay: `${(index * 410) % 3400}ms`,
  duration: `${3 + (index % 5) * 0.4}s`,
  color: `var(--series-${(index % 4) + 1})`,
  isRound: index % 3 === 0,
}));

const FRIENDS = [
  { body: 'cloud', color: 'pink', left: '18%', top: '72%', size: 72, expression: 'laughing', state: 'wink', delay: '0ms' },
  { body: 'triangle', color: 'amber', left: '82%', top: '70%', size: 68, expression: 'excited', state: 'wide', delay: '600ms' },
  { body: 'circle', color: 'blue', left: '22%', top: '26%', size: 58, expression: 'happy', state: 'notify', delay: '1200ms' },
  { body: 'hexagon', color: 'green', left: '80%', top: '24%', size: 60, expression: 'proud', state: 'idle', delay: '1800ms' },
] as const;

interface OnboardingSceneDoneProps {
  bot?: Bot
}

export function OnboardingSceneDone({ bot }: OnboardingSceneDoneProps) {
  return (
    <OnboardingScene>
      {CONFETTI.map((piece) => (
        <span
          className="absolute -top-4 size-2 motion-safe:animate-scene-confetti motion-reduce:hidden"
          key={`${piece.left}-${piece.delay}`}
          style={{
            left: piece.left,
            backgroundColor: piece.color,
            borderRadius: piece.isRound ? '9999px' : '2px',
            animationDelay: piece.delay,
            animationDuration: piece.duration,
          }}
        />
      ))}
      {FRIENDS.map((friend) => (
        <div
          className="absolute -translate-1/2 motion-safe:animate-scene-float"
          key={friend.body}
          style={{ left: friend.left, top: friend.top, animationDelay: friend.delay }}
        >
          <AvatarBlob
            body={friend.body}
            color={friend.color}
            expression={friend.expression}
            size={friend.size}
            state={friend.state}
          />
        </div>
      ))}
      <div className="absolute top-1/2 left-1/2 flex -translate-1/2 flex-col items-center gap-1">
        <OnboardingSceneBubble>{m.onboarding_scene_done()}</OnboardingSceneBubble>
        {bot ? (
          <BotAvatar
            animate
            bot={bot}
            size={136}
          />
        ) : (
          <AvatarBlob
            body="squircle"
            color="red"
            expression="laughing"
            size={136}
            state="wide"
          />
        )}
      </div>
    </OnboardingScene>
  );
}
