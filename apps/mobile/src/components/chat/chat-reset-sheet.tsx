import { m } from '@openbots/i18n/client';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { match, P } from 'ts-pattern';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { useConnection } from '@/hooks/use-connection';
import { useToast } from '@/hooks/use-toast';
import type { BotDetailsRouteParams } from '@/types/bot-details.types';
import type { NavigationRoot } from '@/types/navigation.types';
import type { RpcSession } from '@/types/rpc.types';

interface ChatResetSheetProps {
  route: { params: BotDetailsRouteParams };
}

export function ChatResetSheet({ route }: ChatResetSheetProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => <ChatResetSheetContent botId={route.params.botId} session={current} />)
    .otherwise(() => null);
}

interface ChatResetSheetContentProps {
  session: RpcSession;
  botId: string;
}

function ChatResetSheetContent({ session, botId }: ChatResetSheetContentProps) {
  const navigation = useNavigation<NavigationRoot>();
  const toast = useToast();
  const bots = useQuery(session.rpc.bots.list.queryOptions());
  const name = bots.data?.find((item) => item.id === botId)?.name ?? '';

  const reset = useMutation(session.rpc.commands.execute.mutationOptions({
    onSuccess: () => {
      toast.show({ message: m.rooms_fresh_done(), variant: 'default' });
      navigation.popTo('Chat', { botId }, { merge: true });
    },
  }));

  return (
    <ConfirmSheet
      confirmLabel={m.rooms_member_reset()}
      description={m.rooms_reset_description({ bot: name })}
      error={reset.isError ? m.rooms_fresh_failed() : null}
      isPending={reset.isPending}
      title={m.rooms_reset_title({ bot: name })}
      onCancel={() => navigation.goBack()}
      onConfirm={() => reset.mutate({ botId, name: 'reset' })}
    />
  );
}
