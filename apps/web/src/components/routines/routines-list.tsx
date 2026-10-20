import { m } from '@openbots/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { RoutinesItem } from '@/components/routines/routines-item';
import { EmptyCompact } from '@/components/ui/empty';
import { FormErrors } from '@/components/ui/forms/form';
import { ItemGroup } from '@/components/ui/item';
import { Skeleton } from '@/components/ui/skeleton';
import { ROOMS } from '@/services/rooms/rooms.constants';
import { rpc } from '@/services/rpc/rpc.client';
import IconCalendarClock from '~icons/lucide/calendar-clock';
import type { Bot } from '@openbots/contracts/universal';

interface RoutinesListProps {
  bot: Bot
}

export function RoutinesList({ bot }: RoutinesListProps) {
  const list = useQuery(rpc.routines.list.queryOptions({ input: { botId: bot.id }, refetchInterval: ROOMS.routinesRefreshMs }));

  return (
    <div className="flex flex-col gap-3">
      <FormErrors error={list.isError ? m.rooms_routines_error() : null} />
      {list.isPending ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((key) => (
            <div className="flex flex-col gap-1.5" key={key}>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : null}
      {list.data?.length === 0 ? (
        <EmptyCompact
          description={m.rooms_routines_empty_hint({ bot: bot.name })}
          icon={<IconCalendarClock />}
          title={m.rooms_routines_empty_title()}
        />
      ) : null}
      {list.data && list.data.length > 0 ? (
        <ItemGroup variant="outline">
          {list.data.map((routine) => (
            <RoutinesItem
              bot={bot}
              key={routine.id}
              routine={routine}
            />
          ))}
        </ItemGroup>
      ) : null}
    </div>
  );
}
