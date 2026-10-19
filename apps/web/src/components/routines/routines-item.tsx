import { m } from '@openbots/i18n/client';
import { getLocale } from '@openbots/i18n/runtime';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useHydrated } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import { toasty } from '@/components/ui/sonner';
import { Switch } from '@/components/ui/switch';
import { routinesScheduleText } from '@/services/routines/routines.client';
import { rpc } from '@/services/rpc/rpc.client';
import IconEllipsisVertical from '~icons/lucide/ellipsis-vertical';
import IconPencil from '~icons/lucide/pencil';
import IconRotateCw from '~icons/lucide/rotate-cw';
import IconTrash from '~icons/lucide/trash-2';
import type { Bot, Routine } from '@openbots/contracts/universal';

interface RoutinesItemProps {
  bot: Bot
  routine: Routine
}

export function RoutinesItem({ bot, routine }: RoutinesItemProps) {
  const hydrated = useHydrated();
  const queryClient = useQueryClient();

  const params = { botId: bot.id, routineId: routine.id };

  const settled = {
    onError: () => toasty(m.rooms_routines_action_failed(), '⚠️'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: rpc.routines.key() }),
  };

  const update = useMutation(rpc.routines.update.mutationOptions(settled));

  const run = useMutation(rpc.routines.run.mutationOptions({
    ...settled,
    onSuccess: () => toasty(m.rooms_routines_started({ name: routine.name }), '⏱️'),
  }));

  const pending = update.isPending || run.isPending;
  const when = hydrated ? routinesScheduleText({ schedule: routine.schedule, locale: getLocale() }) : routine.name;

  return (
    <Item size="sm">
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full">
          <span className="truncate">{routine.name}</span>
        </ItemTitle>
        <ItemDescription className="truncate">{when}</ItemDescription>
        {routine.lastRun?.status === 'unanswered' ? (
          <p className="text-xs text-destructive" role="alert">{m.rooms_routines_failed()}</p>
        ) : null}
      </ItemContent>
      <ItemActions>
        <Switch
          aria-label={m.rooms_routines_toggle({ name: routine.name })}
          checked={routine.isEnabled}
          disabled={pending}
          onCheckedChange={(isEnabled) => update.mutate({ ...params, isEnabled })}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={m.rooms_routines_actions()}
              disabled={pending}
              size="icon-xs"
              title={m.rooms_routines_actions()}
              type="button"
              variant="ghost"
            >
              <IconEllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => run.mutate(params)}>
              <IconRotateCw />
              {m.rooms_routines_run()}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                params={params}
                resetScroll={false}
                to="/bots/$botId/routines/$routineId/edit"
              >
                <IconPencil />
                {m.rooms_routines_edit()}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild variant="destructive">
              <Link
                params={params}
                resetScroll={false}
                to="/bots/$botId/routines/$routineId/delete"
              >
                <IconTrash />
                {m.rooms_routines_delete()}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ItemActions>
    </Item>
  );
}
