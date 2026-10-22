import { useChatReset } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { match, P } from 'ts-pattern';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useChatReturn } from '@/hooks/use-chat-return';
import { useConnection } from '@/hooks/use-connection';
import type { RpcSession } from '@/types/rpc.types';

interface ChatResetDialogProps {
  botId: string;
  handoff?: string;
}

export function ChatResetDialog({ botId, handoff }: ChatResetDialogProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => (
      <ChatResetDialogContent
        botId={botId}
        handoff={handoff}
        session={current}
      />
    ))
    .otherwise(() => null);
}

interface ChatResetDialogContentProps {
  session: RpcSession;
  botId: string;
  handoff?: string;
}

function ChatResetDialogContent({ session, botId, handoff }: ChatResetDialogContentProps) {
  const router = useRouter();
  const returnToChat = useChatReturn();
  const bots = useQuery(session.rpc.bots.list.queryOptions());
  const name = bots.data?.find((item) => item.id === botId)?.name ?? '';

  const reset = useChatReset({
    botId,
    handoff,
    onDone: () => returnToChat({ botId }),
  });

  return (
    <ConfirmDialog
      isDestructive
      confirmLabel={m.rooms_member_reset()}
      confirmText={name}
      description={m.rooms_reset_description({ bot: name })}
      error={reset.problem}
      isPending={reset.isPending}
      title={m.rooms_reset_title({ bot: name })}
      onCancel={() => router.back()}
      onConfirm={reset.reset}
    />
  );
}
