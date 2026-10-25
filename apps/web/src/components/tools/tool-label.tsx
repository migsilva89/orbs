import { toolIdentity, toolPresentation, toolPreview } from '@repo/client/client';
import { ToolIcon } from '@/components/tools/tool-icon';
import { ToolTrigger } from '@/components/ui/ai/tool';
import type { DynamicToolUIPart } from 'ai';
import type { ReactNode } from 'react';

interface ToolLabelProps {
  part: DynamicToolUIPart
  avatar?: ReactNode
  label?: string
  icon?: ReactNode
  preview?: string
}

export function ToolLabel({ part, avatar, label, icon, preview }: ToolLabelProps) {
  const presentation = toolPresentation(part);

  return (
    <ToolTrigger
      avatar={avatar}
      icon={icon ?? <ToolIcon toolName={part.toolName} />}
      name={label ?? presentation.label}
      preview={preview ?? toolPreview(part)}
      state={part.state}
      title={toolIdentity(part).identifier}
    />
  );
}
