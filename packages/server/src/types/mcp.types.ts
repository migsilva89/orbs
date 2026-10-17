import type * as UniversalTypes from '@openbots/contracts/universal';
import type { ToolRegistration } from '@openbots/runtime/server';

export interface McpService {
  actions: {
    prepare(params: McpParams): Promise<ToolRegistration[]>;
  };
  queries: {
    catalog(params: McpParams): Promise<UniversalTypes.ResourceMcpCatalog>;
  };
}

export interface McpParams extends Pick<UniversalTypes.ResourceSettings, 'mcpPaths'> {
  botId: string;
  isInherited: boolean;
}
