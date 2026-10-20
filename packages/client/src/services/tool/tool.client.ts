import { toolCallArtifact, toolCallSubagent, toolCallSubagentDetails } from '@openbots/contracts/universal';
import { match, P } from 'ts-pattern';
import { TOOL_ARTIFACT_NAMES, TOOL_MCP_NAME, TOOL_PATH_KEYS, TOOL_PRESENTATIONS, TOOL_PREVIEW_KEYS, TOOL_QUESTION, TOOL_SUBAGENT } from './tool.constants';
import { toolInputTexts, toolReadableName } from './tool.utils';
import type * as ToolTypes from '../../types/tool.types';
import type { ToolCallArtifact } from '@openbots/contracts/universal';
import type { DynamicToolUIPart } from 'ai';

export function toolBlocks({ parts }: ToolTypes.ToolBlocksParams): ToolTypes.ToolBlock[] {
  function toolArtifact(part: DynamicToolUIPart): ToolCallArtifact | undefined {
    return TOOL_ARTIFACT_NAMES.has(part.toolName) && part.state === 'output-available' ? toolCallArtifact.safeParse(part.output).data : undefined;
  }

  function toolSubagent(part: DynamicToolUIPart): ToolTypes.ToolSubagent | undefined {
    const input = part.toolName === TOOL_SUBAGENT ? toolCallSubagent.safeParse(part.input).data : undefined;
    const details = toolCallSubagentDetails.safeParse(part.toolMetadata?.details).data;

    return input ? { ...input, conversationId: details?.conversationId } : undefined;
  }

  return parts.reduce<ToolTypes.ToolBlock[]>((blocks, part, index) => {
    const last = blocks.at(-1);

    if (part.type === 'text') {
      return last?.kind === 'text' ? [...blocks.slice(0, -1), { ...last, parts: [...last.parts, part] }] : [...blocks, { kind: 'text', index, parts: [part] }];
    }

    if (part.type === 'reasoning') {
      return last?.kind === 'reasoning' ? [...blocks.slice(0, -1), { ...last, parts: [...last.parts, part] }] : [...blocks, { kind: 'reasoning', index, parts: [part] }];
    }

    if (part.type === 'data-failure') {
      return [...blocks, { kind: 'failure', index, text: part.data.text }];
    }

    if (part.type !== 'dynamic-tool') {
      return blocks;
    }

    const artifact = toolArtifact(part);

    if (artifact) {
      return [...blocks, { kind: 'artifact', index, artifact }];
    }

    const subagent = toolSubagent(part);

    if (subagent) {
      return [...blocks, { kind: 'subagent', index, part, subagent }];
    }

    if (part.toolName === TOOL_QUESTION && !part.state.startsWith('output-')) {
      return blocks;
    }

    return last?.kind === 'tools' ? [...blocks.slice(0, -1), { ...last, parts: [...last.parts, part] }] : [...blocks, { kind: 'tools', index, parts: [part] }];
  }, []);
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
