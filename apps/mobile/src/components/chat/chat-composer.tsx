import { m } from '@openbots/i18n/client';
import { useMutation } from '@tanstack/react-query';
import { ArrowUp, Plus, Square } from 'lucide-react-native';
import { useState } from 'react';
import { match } from 'ts-pattern';
import { Button } from '@/components/ui/button';
import { FloatingBar } from '@/components/ui/floating-bar';
import { GlassButton } from '@/components/ui/glass-button';
import { Icon } from '@/components/ui/icon';
import { PromptField } from '@/components/ui/prompt-field';
import type { RpcSession } from '@/types/rpc.types';
import type { ChatMessage, ChatOutgoing } from '@openbots/client/client';
import type { Dispatch, SetStateAction } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface ChatComposerProps {
  session: RpcSession;
  botId: string;
  conversationId: number;
  latestEntryId: number;
  isBusy: boolean;
  replyTo: ChatMessage | null;
  onReplyClear: () => void;
  onOutgoingChange: Dispatch<SetStateAction<ChatOutgoing[]>>;
  onSend: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

export function ChatComposer({
  session,
  botId,
  conversationId,
  latestEntryId,
  isBusy,
  replyTo,
  onReplyClear,
  onOutgoingChange,
  onSend,
  onLayout,
}: ChatComposerProps) {
  const [text, setText] = useState('');
  const submit = useMutation(session.rpc.conversation.submit.mutationOptions());
  const stop = useMutation(session.rpc.conversation.stop.mutationOptions());
  const content = text.trim();
  const isStopping = isBusy && !content;

  const stopIcon = (
    <Icon
      fill="currentColor"
      icon={Square}
      size="sm"
    />
  );

  const action = match(isStopping)
    .with(true, () => ({ label: m.rooms_chat_stop(), icon: stopIcon }))
    .with(false, () => ({ label: m.rooms_chat_send(), icon: <Icon icon={ArrowUp} /> }))
    .exhaustive();

  async function send() {
    const replyToEntryId = replyTo?.metadata?.entryId;
    onReplyClear();
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    setText('');
    onSend();
    onOutgoingChange((items) => [...items, { requestId, botId, text: content, afterEntryId: latestEntryId, createdAt: Date.now() }]);

    try {
      const { submissionId } = await submit.mutateAsync({
        botId,
        conversationId,
        requestId,
        content,
        replyToEntryId,
      });

      onOutgoingChange((items) => items.map((item) => (item.requestId === requestId ? { ...item, submissionId } : item)));
    } catch {
      onOutgoingChange((items) => items.filter((item) => item.requestId !== requestId));
      setText((current) => current || content);
    }
  }

  function handlePress() {
    match({ isStopping, content })
      .with({ isStopping: true }, () => stop.mutate({ botId, conversationId }))
      .with({ content: '' }, () => undefined)
      .otherwise(() => void send());
  }

  return (
    <FloatingBar
      className="items-end"
      edge="bottom"
      onLayout={onLayout}
    >
      <GlassButton
        disabled
        accessibilityHint={m.mobile_home_unavailable()}
        accessibilityLabel={m.rooms_chat_attach()}
      >
        <Icon icon={Plus} size="action" />
      </GlassButton>
      <PromptField
        accessibilityLabel={m.rooms_chat_placeholder()}
        actions={(
          <Button
            accessibilityLabel={action.label}
            disabled={!isStopping && !content}
            size="icon-sm"
            variant="default"
            onPress={handlePress}
          >
            {action.icon}
          </Button>
        )}
        className="flex-1"
        placeholder={m.rooms_chat_placeholder()}
        value={text}
        onChangeText={setText}
      />
    </FloatingBar>
  );
}
