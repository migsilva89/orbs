import { m } from '@repo/i18n/client';
import { BotAvatar } from '@repo/ui/bots/bot-avatar';
import { Button } from '@repo/ui/button';
import { Combobox } from '@repo/ui/combobox';
import { SectionDialogNav, SectionDialogNavItem } from '@repo/ui/section-dialog';
import { Link, useNavigate } from '@tanstack/react-router';
import { BOT_NAV } from '@/services/bot/bot.constants';
import IconPlus from '~icons/lucide/plus';
import type { Bot, BotSection } from '@repo/contracts/universal';

interface BotDialogNavProps {
  bots: Bot[]
  bot?: Bot
  section?: BotSection
}

export function BotDialogNav({ bots, bot, section }: BotDialogNavProps) {
  const navigate = useNavigate();

  return (
    <SectionDialogNav
      activeKey={section ?? ''}
      footer={(
        <Button
          asChild
          className="w-full justify-start"
          size="sm"
          variant="ghost"
        >
          <Link
            replace
            to="/bots/create"
          >
            <IconPlus />
            {m.bots_create()}
          </Link>
        </Button>
      )}
      header={(
        <div className="flex items-center gap-1">
          <Combobox
            aria-label={m.bots_switch()}
            className="min-w-0 flex-1"
            groups={[{
              options: bots.map((item) => ({
                value: item.id,
                label: item.name,
                icon: <BotAvatar
                  animate={false}
                  bot={item}
                  size={20}
                />,
              })),
            }]}
            placeholder={m.bots_new()}
            search={{ placeholder: m.bots_search(), empty: m.bots_search_empty() }}
            value={bot?.id ?? ''}
            onValueChange={(botId) => void navigate({
              to: '/bots/$botId/$tab',
              params: { botId, tab: section ?? 'profile' },
              replace: true,
            })}
          />
          <Button
            asChild
            aria-label={m.bots_create()}
            className="@min-[720px]/section-dialog:hidden"
            size="icon"
            title={m.bots_create()}
            variant="ghost"
          >
            <Link
              replace
              to="/bots/create"
            >
              <IconPlus />
            </Link>
          </Button>
        </div>
      )}
      label={m.bots_sections()}
    >
      {BOT_NAV.map((item) => (
        <SectionDialogNavItem isActive={item.id === section} key={item.id}>
          {bot ? (
            <Link
              replace
              params={{ botId: bot.id, tab: item.id }}
              resetScroll={false}
              to="/bots/$botId/$tab"
            >
              <item.icon />
              {item.label()}
            </Link>
          ) : (
            <span aria-disabled className="pointer-events-none opacity-50">
              <item.icon />
              {item.label()}
            </span>
          )}
        </SectionDialogNavItem>
      ))}
    </SectionDialogNav>
  );
}
