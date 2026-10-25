import { toolCallJson, toolCallPeerDetails, toolCallText } from '@repo/contracts/universal';
import { match, P } from 'ts-pattern';
import { TOOL_MCP_NAME, TOOL_PATH_KEYS, TOOL_PEER_NAMES, TOOL_PRESENTATIONS, TOOL_PREVIEW_KEYS } from './tool.constants';
import type * as ToolTypes from '../../types/tool.types';
import type { Bot } from '@repo/contracts/universal';
import type { DynamicToolUIPart } from 'ai';

export function toolInputTexts(part: DynamicToolUIPart): ToolTypes.ToolInputText[] {
  const input = toolCallJson.safeParse(part.input);

  return Object.entries(input.success ? input.data : {}).flatMap(([key, value]) => {
    const text = toolCallText.trim().min(1).safeParse(value);

    return text.success ? [{ key, value: text.data }] : [];
  });
}

export function toolInputText({ input, key }: ToolTypes.ToolInputTextParams): string | undefined {
  return toolCallText.min(1).safeParse(toolCallJson.safeParse(input).data?.[key]).data;
}

export function toolReadableName(name: string): string {
  const words = name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim();

  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function toolPeers(parts: DynamicToolUIPart[], bots: Bot[]): ToolTypes.ToolPeer[] {
  const peers = parts.flatMap((part) => {
    const details = TOOL_PEER_NAMES.has(part.toolName) ? toolCallPeerDetails.safeParse(part.toolMetadata?.details).data : undefined;
    const peer = bots.find((bot) => bot.id === (details?.recipientId ?? toolInputText({ input: part.input, key: 'botId' })));

    return peer ? [{ peer, conversationId: details?.recipientConversationId }] : [];
  });

  return [...new Map(peers.map((item) => [item.peer.id, item])).values()];
}

export function toolIdentity(part: Pick<DynamicToolUIPart, 'toolName'>): ToolTypes.ToolIdentity {
  const mcp = TOOL_MCP_NAME.exec(part.toolName);

  return { name: mcp?.[1] ?? part.toolName, identifier: part.toolName, isMcp: Boolean(mcp) };
}

export function toolPresentation(part: Pick<DynamicToolUIPart, 'toolName'>): ToolTypes.ToolPresentation {
  const identity = toolIdentity(part);
  const known = identity.isMcp ? undefined : TOOL_PRESENTATIONS.get(identity.name);

  return {
    label: known?.label() ?? toolReadableName(identity.name),
    icon: known?.icon ?? (identity.isMcp ? 'mcp' : 'tool'),
  };
}

export function toolPreview(part: DynamicToolUIPart): string | undefined {
  const texts = toolInputTexts(part);
  const preferred = TOOL_PREVIEW_KEYS.map((key) => texts.find((text) => text.key === key)).find(Boolean) ?? texts.at(0);
  const line = preferred?.value.split('\n')[0];

  if (!preferred || !TOOL_PATH_KEYS.has(preferred.key)) {
    return line;
  }

  return line
    ?.split('/')
    .filter(Boolean)
    .at(-1);
}

export function toolOutputText(part: DynamicToolUIPart): string | undefined {
  return match(part)
    .with({ state: 'output-error' }, ({ errorText }) => errorText)
    .with({ state: 'output-available', output: P.string }, ({ output }) => output.trimEnd() || undefined)
    .with({ state: 'output-available' }, ({ output }) => JSON.stringify(output, null, 2))
    .otherwise(() => undefined);
}

export function toolCollapsed({ part, grouped, expanded }: ToolTypes.ToolCollapsedParams): boolean {
  return grouped && !expanded && part.state !== 'approval-requested';
}

export function toolRunning(part: DynamicToolUIPart): boolean {
  return part.state === 'input-streaming' || part.state === 'input-available' || part.state === 'approval-responded';
}

export function toolGroupState({ parts }: ToolTypes.ToolGroupStateParams): DynamicToolUIPart['state'] {
  if (parts.some(toolRunning)) {
    return 'input-available';
  }

  if (parts.some((part) => part.state === 'output-error')) {
    return 'output-error';
  }

  return 'output-available';
}
