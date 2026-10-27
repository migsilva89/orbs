import { m } from '@repo/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { BotFormShared } from '@/components/bots/bot-form-shared';
import { rpc } from '@/services/rpc/rpc.client';

interface BotFormMcpProps {
  botId: string
  busy: boolean
}

export function BotFormMcp({ botId, busy }: BotFormMcpProps) {
  const shared = useQuery(rpc.mcp.shared.queryOptions({ input: { botId } }));

  return (
    <BotFormShared
      busy={busy}
      field="sharedMcp"
      isError={shared.isError}
      items={shared.data?.map((server) => ({ name: server.name, detail: server.source, keywords: server.name }))}
      messages={{
        search: m.bots_mcp_pick_search(),
        noMatch: m.bots_mcp_pick_no_match(),
        loadFailed: m.bots_mcp_pick_load_failed(),
        note: m.bots_mcp_pick_note(),
      }}
      resource="mcp"
    />
  );
}
