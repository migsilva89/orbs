import { m } from '@repo/i18n/client';
import { Brain } from 'lucide-react-native';
import { useState } from 'react';
import { Markdown } from '@/components/ui/markdown';
import { Trace, TraceContent, TraceRow } from '@/components/ui/trace';

interface ChatReasoningProps {
  name: string;
  text: string;
  isStreaming: boolean;
}

export function ChatReasoning({ name, text, isStreaming }: ChatReasoningProps) {
  const [open, setOpen] = useState<boolean>();
  const isOpen = open ?? isStreaming;

  return (
    <Trace>
      <TraceRow
        icon={Brain}
        open={isOpen}
        status={isStreaming ? 'running' : 'done'}
        title={isStreaming ? m.ui_reasoning_streaming({ name }) : m.ui_reasoning_complete({ name })}
        onPress={() => setOpen(!isOpen)}
      />
      {isOpen ? (
        <TraceContent>
          <Markdown isStreaming={isStreaming} tone="muted">{text}</Markdown>
        </TraceContent>
      ) : null}
    </Trace>
  );
}
