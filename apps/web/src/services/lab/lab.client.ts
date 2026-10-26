import { chatQueries } from '@repo/client/react';
import { QueryClient } from '@tanstack/react-query';
import { rpc } from '@/services/rpc/rpc.client';
import { RPC_CONTEXT } from '@/services/rpc/rpc.constants';
import type { LabChatFixture } from '@/types/lab.types';

export function labChatQueryClient({ artifact, bot, bots, subagentViews, subagentContexts }: LabChatFixture) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: false,
        retry: false,
        staleTime: Number.POSITIVE_INFINITY,
      },
    },
  });

  const artifactTarget = { botId: artifact.botId, conversationId: artifact.conversationId, artifactId: artifact.id };

  queryClient.setQueryData(rpc.bots.list.queryKey(), bots);
  queryClient.setQueryData(rpc.conversation.settings.queryKey(), { whenBusy: 'followUp', hideVerbose: false });
  queryClient.setQueryData(rpc.artifacts.get.queryKey({ input: artifactTarget }), artifact);

  queryClient.setQueryData(rpc.conversation.contexts.queryKey({ input: { botId: bot.id, kind: 'subagent' } }), { items: subagentContexts });

  for (const view of subagentViews) {
    queryClient.setQueryData([...chatQueries.view(RPC_CONTEXT, { botId: bot.id, conversationId: view.conversationId }).queryKey], view);
  }

  return queryClient;
}
