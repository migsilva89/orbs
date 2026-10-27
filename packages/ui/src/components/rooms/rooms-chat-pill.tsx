import { m } from '@repo/i18n/client';
import { BotAvatar } from '../bots/bot-avatar';
import { Button } from '../button';
import { useSidebar } from '../sidebar';
import type { ChatActivity } from '@repo/client/client';
import type { Bot } from '@repo/contracts/universal';

interface RoomsChatPillProps {
  bot: Bot
  activity: ChatActivity
}

export function RoomsChatPill({ bot, activity }: RoomsChatPillProps) {
  const { isMobile, open, openMobile, toggleSidebar } = useSidebar();

  return (
    <Button
      aria-expanded={isMobile ? openMobile : open}
      className="max-w-44 min-w-0"
      size="pill"
      title={m.rooms_details()}
      variant="floating"
      onClick={toggleSidebar}
    >
      <BotAvatar
        activity={activity}
        bot={bot}
        size={24}
      />
      <span className="flex min-w-0 flex-col justify-center">
        <span className="truncate text-sm/4 font-medium">{bot.name}</span>
      </span>
    </Button>
  );
}
