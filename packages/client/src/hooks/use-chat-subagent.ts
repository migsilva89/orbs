import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { chatQueries } from '../services/chat/chat.client';
import { toolRunning } from '../services/tool/tool.utils';
import { useRpc } from './use-rpc';
import type { ChatSubagentParams } from '../types/chat.types';

export function useChatSubagent({ botId, part, subagent }: ChatSubagentParams) {
  const rpcs = useRpc();
  const { rpc } = rpcs;
  const queryClient = useQueryClient();
  const isBackground = subagent.operation !== 'run';
  const watch = useQuery({ ...chatQueries.contextsWatch(rpcs, { botId }), enabled: isBackground });
  const contexts = useQuery({ ...rpc.conversation.contexts.queryOptions({ input: { botId, kind: 'subagent' } }), enabled: isBackground });
  const stop = useMutation(rpc.conversation.stop.mutationOptions());
  const context = contexts.data?.items.find((item) => item.conversationId === subagent.conversationId);
  const revision = watch.data?.revision;

  useEffect(() => {
    if (revision !== undefined) {
      void queryClient.invalidateQueries({ queryKey: rpc.conversation.contexts.key({ input: { botId } }) });
    }
  }, [botId, queryClient, revision, rpc]);

  return {
    isRunning: isBackground ? context?.isRunning ?? toolRunning(part) : toolRunning(part),
    isFailed: part.state === 'output-error',
    isStopping: stop.isPending,
    stopFailed: stop.isError,
    stop: () => {
      if (subagent.conversationId) {
        stop.mutate({ botId, conversationId: subagent.conversationId });
      }
    },
  };
}
