import { BOT_ACTIVITY_LABELS, toolRunning } from '@repo/client/client';
import { useChatHideVerbose } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { messageSurface } from '@/components/ui/ai/message';
import { cn } from '@/lib/cn';
import type { ChatActivity, ChatMessage } from '@repo/client/client';

interface RoomsChatActivityProps {
  botName: string
  activity: ChatActivity
  draft?: ChatMessage
  waiting: boolean
}

export function RoomsChatActivity({ botName, activity, draft, waiting }: RoomsChatActivityProps) {
  const { hideVerbose } = useChatHideVerbose();
  const last = draft?.parts.filter((part) => part.type !== 'step-start').at(-1);
  const textSpeaks = activity === 'writing' && last?.type === 'text' && last.state === 'streaming';
  const toolRowSpeaks = !waiting && !hideVerbose && last?.type === 'dynamic-tool' && toolRunning(last);
  const reasoningSpeaks = !waiting && !hideVerbose && last?.type === 'reasoning' && last.state === 'streaming';

  if (textSpeaks || toolRowSpeaks || reasoningSpeaks) {
    return null;
  }

  const label = waiting ? m.rooms_chat_waiting({ bot: botName }) : BOT_ACTIVITY_LABELS[activity]();

  return (
    <output aria-label={label} className="flex items-center gap-3">
      <span aria-hidden className={cn(messageSurface, 'flex h-7 items-center gap-1 rounded-full px-3')}>
        <span className="size-1.5 animate-typing-dot rounded-full bg-muted-foreground motion-reduce:animate-none" />
        <span className="size-1.5 animate-typing-dot-2 rounded-full bg-muted-foreground motion-reduce:animate-none" />
        <span className="size-1.5 animate-typing-dot-3 rounded-full bg-muted-foreground motion-reduce:animate-none" />
      </span>
      {activity === 'thinking' ? null : <span aria-hidden className="shimmer truncate text-sm text-muted-foreground motion-reduce:shimmer-none">{label}</span>}
    </output>
  );
}
