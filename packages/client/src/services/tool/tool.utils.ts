import { toolCallJson, toolCallText } from '@openbots/contracts/universal';
import type * as ToolTypes from '../../types/tool.types';
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
