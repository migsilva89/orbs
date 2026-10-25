import { m } from '@repo/i18n/client';
import { useInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Link, useMatch } from '@tanstack/react-router';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { RoomsActivityRun } from '@/components/rooms/rooms-activity-run';
import { Button } from '@/components/ui/button';
import { EmptyCompact } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { roomsLink } from '@/services/rooms/rooms.client';
import { rpc } from '@/services/rpc/rpc.client';
import IconActivity from '~icons/lucide/activity';
import IconChevronLeft from '~icons/lucide/chevron-left';

interface RoomsActivityProps {
  botId: string
}

export function RoomsActivity({ botId }: RoomsActivityProps) {
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const bot = bots.find((item) => item.id === botId);
  const open = useMatch({ from: '/_chat/rooms/direct/$handle/activity/$runId', shouldThrow: false });

  const runs = useInfiniteQuery({
    ...rpc.activity.list.infiniteOptions({
      input: (before: number | undefined) => ({ botId, before }),
      initialPageParam: undefined,
      getNextPageParam: (page) => page.nextBefore ?? undefined,
    }),
    refetchInterval: (query) => (query.state.data?.pages[0]?.runs.some((run) => run.isLive) ? 2000 : 15_000),
  });

  if (!bot) {
    return null;
  }

  const items = runs.data?.pages.flatMap((page) => page.runs) ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button
          asChild
          aria-label={m.rooms_activity_back()}
          size="icon-sm"
          title={m.rooms_activity_back()}
          variant="outline"
        >
          <Link {...roomsLink(bot)}>
            <IconChevronLeft className="size-4" />
          </Link>
        </Button>
        <BotAvatar bot={bot} size={28} />
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-sm font-medium">{m.rooms_activity()}</h1>
          <p className="truncate text-xs text-muted-foreground">{bot.name}</p>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex w-full flex-col gap-3 p-6">
          {runs.isPending ? [0, 1, 2, 3].map((key) => (
            <div className="flex flex-col gap-1.5 py-2 pl-8.5" key={key}>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          )) : null}
          {runs.isError ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{m.rooms_activity_error()}</span>
              <Button
                size="xs"
                variant="outline"
                onClick={() => void runs.refetch()}
              >{m.rooms_activity_retry()}</Button>
            </div>
          ) : null}
          {runs.isSuccess && items.length === 0 ? (
            <EmptyCompact
              description={m.rooms_activity_empty({ bot: bot.name })}
              icon={<IconActivity />}
              title={m.rooms_activity_empty_title()}
            />
          ) : null}
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {items.map((run) => (
              <RoomsActivityRun
                bot={bot}
                isOpen={open?.params.runId === run.id}
                key={run.id}
                run={run}
              />
            ))}
          </ul>
          {runs.hasNextPage ? (
            <Button
              className="self-center"
              disabled={runs.isFetchingNextPage}
              variant="outline"
              onClick={() => void runs.fetchNextPage()}
            >
              {m.rooms_activity_more()}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
