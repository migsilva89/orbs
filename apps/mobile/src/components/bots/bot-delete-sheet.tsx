import { m } from '@openbots/i18n/client';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { match, P } from 'ts-pattern';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { useConnection } from '@/hooks/use-connection';
import type { BotDetailsRouteParams } from '@/types/bot-details.types';
import type { NavigationRoot } from '@/types/navigation.types';
import type { RpcSession } from '@/types/rpc.types';

interface BotDeleteSheetProps {
  route: { params: BotDetailsRouteParams };
}

export function BotDeleteSheet({ route }: BotDeleteSheetProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => <BotDeleteSheetContent botId={route.params.botId} session={current} />)
    .otherwise(() => null);
}

interface BotDeleteSheetContentProps {
  session: RpcSession;
  botId: string;
}

function BotDeleteSheetContent({ session, botId }: BotDeleteSheetContentProps) {
  const queryClient = useQueryClient();
  const navigation = useNavigation<NavigationRoot>();
  const bots = useQuery(session.rpc.bots.list.queryOptions());
  const name = bots.data?.find((item) => item.id === botId)?.name ?? '';

  const remove = useMutation(session.rpc.bots.delete.mutationOptions({
    onSuccess: async () => {
      navigation.popTo('Bots');
      await queryClient.invalidateQueries({ queryKey: session.rpc.bots.list.key() });

      for (const queryKey of [session.rpc.routines.key(), session.rpc.todos.key(), session.rpc.artifacts.key()]) {
        queryClient.removeQueries({ queryKey });
      }
    },
  }));

  return (
    <ConfirmSheet
      isDestructive
      confirmLabel={m.rooms_bot_delete()}
      description={m.rooms_bot_delete_description()}
      error={remove.isError ? m.rooms_bot_delete_error() : null}
      isPending={remove.isPending}
      title={m.rooms_bot_delete_title({ bot: name })}
      onCancel={() => navigation.goBack()}
      onConfirm={() => remove.mutate({ botId })}
    />
  );
}
