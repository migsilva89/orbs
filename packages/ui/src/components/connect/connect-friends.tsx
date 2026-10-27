import { m } from '@repo/i18n/client';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';
import { AvatarBlob } from '../avatars/avatar-blob';
import type { ExpressionId } from '@repo/avatar-blobs/expressions';
import type { BodyId, ColorId } from '@repo/avatar-blobs/skins';
import type { StateId } from '@repo/avatar-blobs/states';

interface ConnectFriendsBot {
  body: BodyId
  color: ColorId
  size: number
  left: string
  top: string
  floatMs: number
}

interface ConnectFriendsMood {
  state?: StateId
  expression?: ExpressionId
}

interface ConnectFriendsBeat {
  speaker?: number
  line?: () => string
  moods: Partial<Record<number, ConnectFriendsMood>>
}

const FRIENDS: ConnectFriendsBot[] = [
  { body: 'circle', color: 'blue', size: 104, left: '32%', top: '36%', floatMs: 4200 },
  { body: 'cloud', color: 'pink', size: 96, left: '72%', top: '30%', floatMs: 5100 },
  { body: 'triangle', color: 'amber', size: 92, left: '74%', top: '68%', floatMs: 4600 },
  { body: 'squircle', color: 'red', size: 100, left: '36%', top: '76%', floatMs: 5600 },
  { body: 'droplet', color: 'violet', size: 72, left: '56%', top: '54%', floatMs: 3800 },
];

const SKELETON_MESSAGES = [
  ['w-2/5', 'w-3/5'],
  ['w-1/2'],
  ['w-1/3', 'w-2/3', 'w-1/4'],
  ['w-3/5'],
];

const SLEEPER = 3;

const BEATS: ConnectFriendsBeat[] = [
  { speaker: 1, line: m.connect_friends_typing, moods: { 1: { expression: 'excited' }, [SLEEPER]: { expression: 'sleepy' } } },
  { speaker: 2, line: m.connect_friends_human, moods: { 2: { state: 'notify', expression: 'curious' }, 0: { expression: 'suspicious' }, 4: { expression: 'curious' }, [SLEEPER]: { expression: 'sleepy' } } },
  { speaker: 0, line: m.connect_friends_natural, moods: { 0: { state: 'wide', expression: 'surprised' }, 4: { expression: 'shy' }, 2: { expression: 'suspicious' }, [SLEEPER]: { expression: 'sleepy' } } },
  { speaker: 4, line: m.connect_friends_bite, moods: { 4: { state: 'wink', expression: 'proud' }, 1: { expression: 'happy' }, [SLEEPER]: { expression: 'sleepy' } } },
  { speaker: SLEEPER, line: m.connect_friends_meeting, moods: { [SLEEPER]: { state: 'exclaim', expression: 'surprised' }, 0: { expression: 'laughing' }, 1: { expression: 'laughing' }, 2: { expression: 'laughing' }, 4: { expression: 'happy' } } },
  { moods: { 0: { expression: 'happy' }, 1: { expression: 'happy' }, 2: { expression: 'happy' }, 3: { expression: 'happy' }, 4: { expression: 'happy' } } },
];

const BEAT_MS = 2800;

export function ConnectFriends() {
  const [beatIndex, setBeatIndex] = useState(0);
  const friendRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shadowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const beat = BEATS[beatIndex];

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const friends = friendRefs.current;

    const floats = friends.map((element, index) => element?.animate(
      [{ translate: '0 0', rotate: '0deg' }, { translate: '0 -10px', rotate: index % 2 ? '3deg' : '-3deg' }, { translate: '0 0', rotate: '0deg' }],
      {
        duration: FRIENDS[index].floatMs,
        iterations: Infinity,
        easing: 'ease-in-out',
        delay: index * -700,
      },
    ));

    const shadows = shadowRefs.current.map((element, index) => element?.animate(
      [{ scale: '1', opacity: 1 }, { scale: '0.75', opacity: 0.5 }, { scale: '1', opacity: 1 }],
      {
        duration: FRIENDS[index].floatMs,
        iterations: Infinity,
        easing: 'ease-in-out',
        delay: index * -700,
      },
    ));

    let current = 0;

    const timer = setInterval(() => {
      current = (current + 1) % BEATS.length;
      setBeatIndex(current);

      const speaker = BEATS[current].speaker;

      if (speaker !== undefined) {
        friends[speaker]?.animate([{ scale: '1' }, { scale: '1.12' }, { scale: '0.96' }, { scale: '1' }], { duration: 520, easing: 'ease-out' });
      }
    }, BEAT_MS);

    return () => {
      clearInterval(timer);
      [...floats, ...shadows].forEach((animation) => animation?.cancel());
    };
  }, []);

  return (
    <div aria-hidden="true" className="relative hidden overflow-hidden border-l border-border/60 bg-muted md:block">
      <div className="absolute inset-0 perspective-distant">
        <div className="absolute top-[10%] left-[12%] flex h-4/5 w-[110%] rotate-x-6 -rotate-y-12 flex-col rounded-2xl border bg-background/70">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <div className="h-2 w-16 rounded-full bg-muted-foreground/20" />
            <div className="ml-auto flex -space-x-1">
              {FRIENDS.slice(0, 3).map((friend) => <div className="size-3 rounded-full bg-muted-foreground/20 ring-2 ring-background" key={friend.body} />)}
            </div>
          </div>
          {SKELETON_MESSAGES.map((lines) => (
            <div className="flex gap-2 px-4 py-2.5" key={lines.join()}>
              <div className="size-5 shrink-0 rounded-full bg-muted-foreground/15" />
              <div className="flex flex-1 flex-col gap-1.5 pt-1">
                {lines.map((width) => <div className={cn('h-2 rounded-full bg-muted-foreground/15', width)} key={width} />)}
              </div>
            </div>
          ))}
          <div className="mx-4 mt-auto mb-4 h-8 rounded-full border" />
        </div>
      </div>
      {FRIENDS.map((friend, index) => {
        const mood = beat.moods[index];

        return (
          <div
            className="absolute -translate-1/2"
            key={friend.body}
            style={{ left: friend.left, top: friend.top }}
          >
            <div
              className="absolute bottom-2 left-[20%] h-2.5 w-3/5 rounded-full bg-foreground/10 blur-xs"
              ref={(element) => {
                shadowRefs.current[index] = element;
              }}
            />
            <div
              className="relative"
              ref={(element) => {
                friendRefs.current[index] = element;
              }}
            >
              {beat.speaker === index && beat.line ? (
                <p className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 animate-in rounded-2xl border bg-background px-3 py-1.5 text-xs whitespace-nowrap shadow-sm fade-in-0 zoom-in-90" key={beatIndex}>
                  {beat.line()}
                </p>
              ) : null}
              <AvatarBlob
                body={friend.body}
                color={friend.color}
                expression={mood?.expression ?? 'attentive'}
                follow={index !== SLEEPER || beat.speaker === SLEEPER}
                size={friend.size}
                state={mood?.state ?? 'idle'}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
