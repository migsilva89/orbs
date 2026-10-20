import { m } from '@openbots/i18n/client';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import type { ChatActivity } from '@openbots/client/client';
import type { Bot } from '@openbots/contracts/universal';

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
