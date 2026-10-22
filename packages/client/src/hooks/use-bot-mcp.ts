import { m } from '@repo/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { match } from 'ts-pattern';
import { SETTINGS } from '../services/settings/settings.constants';
import { useRpc } from './use-rpc';
import type { BotMcpParams } from '../types/bot.types';
import type { SettingsProviderStatus } from '../types/settings.types';
import type { McpCatalog } from '@repo/contracts/universal';

/**
 * A bot's MCP servers and their OAuth login. Opening it connects the bot's servers once, so new servers show their real
 * state. The daemon finishes the login on its own callback page, so the app only opens the provider's page and polls
 * until the server reports a login; pasting the callback address is the fallback.
 */
export function useBotMcp({ botId, login: target }: BotMcpParams) {
  const { rpc } = useRpc();
  const queryClient = useQueryClient();
  const [started, setStarted] = useState<string | null>(null);

  const login = useQuery({
    ...rpc.mcpAuth.status.queryOptions({ input: { botId, name: started ?? '' } }),
    enabled: started !== null,
    refetchInterval: (query) => (query.state.data === undefined || query.state.data.status === 'pending' ? SETTINGS.providerPollMs : false),
  });

  const discover = useQuery(rpc.mcp.discover.queryOptions({ input: { botId } }));

  const prepare = useMutation(rpc.mcp.connect.mutationOptions({
    onSuccess: (catalog) => queryClient.setQueryData(rpc.mcp.discover.queryKey({ input: { botId } }), catalog),
  }));

  const { mutate: prepareServers } = prepare;

  useEffect(() => {
    prepareServers({ botId });
  }, [botId, prepareServers]);
  const isDone = login.data !== undefined && login.data.status !== 'pending';
  const pending = isDone ? null : started;

  const refresh = () => queryClient.invalidateQueries({ queryKey: rpc.mcp.discover.key() });

  useEffect(() => {
    if (isDone) {
      void queryClient.invalidateQueries({ queryKey: rpc.mcp.discover.key() });
    }
  }, [isDone, queryClient, rpc]);

  const stop = () => {
    setStarted(null);
    void refresh();
  };

  const start = useMutation(rpc.mcpAuth.start.mutationOptions());
  const complete = useMutation(rpc.mcpAuth.complete.mutationOptions({ onSuccess: stop }));
  const cancel = useMutation(rpc.mcpAuth.cancel.mutationOptions({ onSuccess: stop }));
  const logout = useMutation(rpc.mcpAuth.logout.mutationOptions({ onSuccess: () => void refresh() }));

  async function connect(name: string) {
    queryClient.removeQueries({ queryKey: rpc.mcpAuth.status.key() });
    const { redirectUrl, returnUrl, open } = target();

    const result = await start.mutateAsync({
      botId,
      name,
      redirectUrl,
      returnUrl,
    });

    await match(result)
      .with({ status: 'authorized' }, async () => refresh())
      .with({ status: 'redirect' }, async ({ authorizationUrl }) => {
        setStarted(name);
        await open(authorizationUrl);
        await refresh();
      })
      .exhaustive();
  }

  const status = (server: McpCatalog['servers'][number]): SettingsProviderStatus => match({ server, isPending: pending === server.name })
    .with({ isPending: true }, () => ({ tone: 'warning' as const, label: m.bots_mcp_waiting() }))
    .with({ server: { auth: 'required' } }, () => ({ tone: 'warning' as const, label: m.bots_mcp_login_required() }))
    .with({ server: { status: 'connected' } }, () => ({ tone: 'success' as const, label: m.bots_mcp_connected() }))
    .with({ server: { status: 'connecting' } }, () => ({ tone: 'default' as const, label: m.bots_mcp_connecting() }))
    .with({ server: { status: 'error' } }, () => ({ tone: 'destructive' as const, label: m.bots_mcp_error() }))
    .with({ server: { status: 'disabled' } }, () => ({ tone: 'default' as const, label: m.bots_mcp_disabled() }))
    .otherwise(() => ({ tone: 'default' as const, label: m.bots_mcp_not_connected() }));

  return {
    servers: discover.data?.servers ?? [],
    isEmpty: discover.data?.servers.length === 0,
    pending,
    status,
    isBusy: start.isPending || complete.isPending || cancel.isPending || logout.isPending,
    problem: match({ isLoadFailed: discover.isError || prepare.isError, isLoginFailed: start.isError || complete.isError })
      .with({ isLoadFailed: true }, () => m.bots_mcp_load_failed())
      .with({ isLoginFailed: true }, () => m.bots_mcp_failed())
      .otherwise(() => null),
    connect: (name: string) => void connect(name).catch(() => setStarted(null)),
    paste: (callbackUrl: string) => pending && complete.mutate({
      botId,
      name: pending,
      callbackUrl,
    }),
    cancel: () => pending && cancel.mutate({ botId, name: pending }),
    logout: (name: string) => logout.mutate({ botId, name }),
  };
}
