import { m } from '@repo/i18n/client';
import { BotAvatar } from '@repo/ui/bots/bot-avatar';
import { Button } from '@repo/ui/button';
import { Item, ItemContent, ItemDescription, ItemTitle } from '@repo/ui/item';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { LayoutPageHeader } from '@/components/layout/layout-page-header';
import { rpc } from '@/services/rpc/rpc.client';
import IconChevronRight from '~icons/lucide/chevron-right';
import IconPlus from '~icons/lucide/plus';

export function BotList() {
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <LayoutPageHeader>
        <Button
          asChild
          size="sm"
          variant="ghost"
        >
          <Link to="/bots/create">
            <IconPlus />
            {m.bots_new()}
          </Link>
        </Button>
      </LayoutPageHeader>
      <div className="scrollbar min-h-0 flex-1 overflow-y-auto [--scrollbar-thumb:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] [--scrollbar-track:transparent] scrollbar-h-1 scrollbar-thumb-rounded-full scrollbar-w-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
          <ul className="grid gap-2 sm:grid-cols-2">
            {bots.map((bot) => (
              <Item
                className="relative"
                key={bot.id}
                variant="outline"
              >
                <BotAvatar
                  animate={false}
                  bot={bot}
                  size={32}
                />
                <ItemContent className="min-w-0">
                  <ItemTitle className="w-full">
                    <Link
                      className="truncate after:absolute after:inset-0"
                      params={{ botId: bot.id }}
                      to="/bots/$botId"
                    >
                      {bot.name}
                    </Link>
                  </ItemTitle>
                  <ItemDescription className="truncate">@{bot.handle} · {bot.modelId}</ItemDescription>
                </ItemContent>
                <IconChevronRight className="size-4 text-muted-foreground" />
              </Item>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
