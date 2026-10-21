import { m } from '@openbots/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { match, P } from 'ts-pattern';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useConnection } from '@/hooks/use-connection';
import type { RpcSession } from '@/types/rpc.types';

interface RoutinesDeleteDialogProps {
  botId: string;
  routineId: string;
}

export function RoutinesDeleteDialog(params: RoutinesDeleteDialogProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => <RoutinesDeleteDialogContent params={params} session={current} />)
    .otherwise(() => null);
}

interface RoutinesDeleteDialogContentProps {
  session: RpcSession;
  params: RoutinesDeleteDialogProps;
}

function RoutinesDeleteDialogContent({ session, params: { botId, routineId } }: RoutinesDeleteDialogContentProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const bots = useQuery(session.rpc.bots.list.queryOptions());
  const routines = useQuery(session.rpc.routines.list.queryOptions({ input: { botId } }));
  const bot = bots.data?.find((item) => item.id === botId);
  const routine = routines.data?.find((item) => item.id === routineId);

  const remove = useMutation(session.rpc.routines.remove.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: session.rpc.routines.key() });
      router.back();
    },
  }));

  return (
    <ConfirmDialog
      isDestructive
      confirmLabel={m.rooms_routines_delete()}
      description={m.rooms_routines_delete_description({ bot: bot?.name ?? '' })}
      error={remove.isError ? m.rooms_routines_action_failed() : null}
      isPending={remove.isPending}
      title={m.rooms_routines_delete_title({ name: routine?.name ?? '' })}
      onCancel={() => router.back()}
      onConfirm={() => remove.mutate({ botId, routineId })}
    />
  );
}
