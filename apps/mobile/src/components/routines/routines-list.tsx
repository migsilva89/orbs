import { routinesScheduleText } from '@openbots/client/client';
import { getLocale, m } from '@openbots/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock } from 'lucide-react-native';
import { Switch, View } from 'react-native';
import { Empty, EmptyLink } from '@/components/ui/empty';
import { Icon } from '@/components/ui/icon';
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import { Text } from '@/components/ui/text';
import { useToast } from '@/hooks/use-toast';
import type { BotDetailsSectionProps } from '@/types/bot-details.types';
import type { RpcSession } from '@/types/rpc.types';

interface RoutinesListProps extends BotDetailsSectionProps {
  session: RpcSession;
}

export function RoutinesList({ session, bot, onPrefill }: RoutinesListProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const list = useQuery(session.rpc.routines.list.queryOptions({ input: { botId: bot.id } }));

  const update = useMutation(session.rpc.routines.update.mutationOptions({
    onError: () => toast.show({ message: m.rooms_routines_action_failed() }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: session.rpc.routines.key() }),
  }));

  const routines = list.data ?? [];

  return (
    <View className="gap-2">
      {list.isError ? <Text tone="destructive" variant="small">{m.rooms_routines_error()}</Text> : null}
      {list.isSuccess && routines.length === 0 ? (
        <Empty
          description={(
            <>
              {`${m.rooms_routines_empty_hint({ bot: bot.name })} `}
              <EmptyLink onPress={() => onPrefill(m.rooms_routines_prefill())}>{m.rooms_prefill_create_inline()}</EmptyLink>
              {` ${m.rooms_prefill_by_asking({ bot: bot.name })}`}
            </>
          )}
          icon={(
            <Icon
              icon={CalendarClock}
              size="lg"
              tone="muted"
            />
          )}
          size="sm"
          title={m.rooms_routines_empty_title()}
        />
      ) : null}
      {routines.length > 0 ? (
        <View className="overflow-hidden rounded-lg border border-border bg-card">
          {routines.map((routine) => (
            <Item key={routine.id} size="sm">
              <ItemContent>
                <ItemTitle numberOfLines={1}>{routine.name}</ItemTitle>
                <ItemDescription numberOfLines={1}>{routinesScheduleText({ schedule: routine.schedule, locale: getLocale() })}</ItemDescription>
                {routine.lastRun?.status === 'unanswered' ? <Text tone="destructive" variant="small">{m.rooms_routines_failed()}</Text> : null}
              </ItemContent>
              <Switch
                accessibilityLabel={m.rooms_routines_toggle({ name: routine.name })}
                disabled={update.isPending}
                value={routine.isEnabled}
                onValueChange={(isEnabled) => update.mutate({
                  botId: bot.id,
                  routineId: routine.id,
                  isEnabled,
                })}
              />
            </Item>
          ))}
        </View>
      ) : null}
      {routines.length > 0 ? (
        <Text tone="muted" variant="small">
          <EmptyLink onPress={() => onPrefill(m.rooms_routines_prefill())}>{m.rooms_prefill_create()}</EmptyLink>
        </Text>
      ) : null}
    </View>
  );
}
