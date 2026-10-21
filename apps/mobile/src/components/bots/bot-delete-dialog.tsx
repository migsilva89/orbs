import { useBotDelete } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { match, P } from 'ts-pattern';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useConnection } from '@/hooks/use-connection';
import type { RpcSession } from '@/types/rpc.types';

interface BotDeleteDialogProps {
  botId: string;
}

export function BotDeleteDialog({ botId }: BotDeleteDialogProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => <BotDeleteDialogContent botId={botId} session={current} />)
    .otherwise(() => null);
}

interface BotDeleteDialogContentProps {
  session: RpcSession;
  botId: string;
}

function BotDeleteDialogContent({ session, botId }: BotDeleteDialogContentProps) {
  const router = useRouter();
  const bots = useQuery(session.rpc.bots.list.queryOptions());
  const name = bots.data?.find((item) => item.id === botId)?.name ?? '';

  const remove = useBotDelete({ botId, onDeleted: () => router.dismissTo('/') });

  return (
    <ConfirmDialog
      isDestructive
      confirmLabel={m.rooms_bot_delete()}
      confirmText={name}
      description={m.rooms_bot_delete_description()}
      error={remove.problem}
      isPending={remove.isPending}
      title={m.rooms_bot_delete_title({ bot: name })}
      onCancel={() => router.back()}
      onConfirm={remove.remove}
    />
  );
}
