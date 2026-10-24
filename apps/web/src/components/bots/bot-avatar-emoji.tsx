import { m } from '@repo/i18n/client';
import { lazy, Suspense, useState } from 'react';
import { RoomsChatEmojiLoading } from '@/components/rooms/rooms-chat-emoji-loading';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import IconSmile from '~icons/lucide/smile';

const RoomsChatEmojiPicker = lazy(() => import('@/components/rooms/rooms-chat-emoji-picker').then((module) => ({ default: module.RoomsChatEmojiPicker })));

interface BotAvatarEmojiProps {
  disabled: boolean
  onPick: (emoji: string) => void
}

export function BotAvatarEmoji({ disabled, onPick }: BotAvatarEmojiProps) {
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = () => setAttempt((count) => count + 1);

  const pick = (emoji: string) => {
    setOpen(false);
    onPick(emoji);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          size="sm"
          type="button"
          variant="ghost"
        >
          <IconSmile />
          {m.avatars_emoji()}
        </Button>
      </PopoverTrigger>
      <PopoverContent arrow={false} className="w-auto p-0">
        <Suspense fallback={<RoomsChatEmojiLoading onRetry={retry} />} key={attempt}>
          <RoomsChatEmojiPicker
            layout="popover"
            onPick={pick}
            onRetry={retry}
          />
        </Suspense>
      </PopoverContent>
    </Popover>
  );
}
