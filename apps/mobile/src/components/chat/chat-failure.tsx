import { m } from '@repo/i18n/client';
import { CircleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { Trace, TraceCode, TraceContent, TraceRow } from '@/components/ui/trace';

interface ChatFailureProps {
  botName: string;
  detail: string;
}

export function ChatFailure({ botName, detail }: ChatFailureProps) {
  const [open, setOpen] = useState(false);

  return (
    <Trace className="mx-3">
      <TraceRow
        icon={CircleAlert}
        open={open}
        status="error"
        title={m.rooms_chat_failed({ bot: botName })}
        onPress={() => setOpen(!open)}
      />
      {open ? (
        <TraceContent>
          <TraceCode tone="destructive">{detail}</TraceCode>
        </TraceContent>
      ) : null}
    </Trace>
  );
}
