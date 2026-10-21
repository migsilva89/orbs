import { mentionLinks, mentionQuery, mentionSegments, mentionSubmission, roomsMessageText } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { useMutation, useMutationState } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowUp, Plus, Square } from 'lucide-react-native';
import { useState } from 'react';
import { ActionSheetIOS, View } from 'react-native';
import { match } from 'ts-pattern';
import { Button } from '@/components/ui/button';
import { GlassButton } from '@/components/ui/glass-button';
import { Icon } from '@/components/ui/icon';
import { PromptAttachment, PromptAttachments, PromptDock, PromptDrawer, PromptJump, PromptQuote } from '@/components/ui/prompt-drawer';
import { PromptField, PromptMention } from '@/components/ui/prompt-field';
import { useChatAttachments } from '@/hooks/use-chat-attachments';
import { useToast } from '@/hooks/use-toast';
import { ChatMentions } from './chat-mentions';
import { ChatQueue } from './chat-queue';
import type { RpcSession } from '@/types/rpc.types';
import type * as ClientTypes from '@openbots/client/client';
import type { Bot, CommandExecuteInput } from '@openbots/contracts/universal';
import type { MutationState } from '@tanstack/react-query';
import type { Dispatch, SetStateAction } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface ChatComposerProps {
  session: RpcSession;
  bot: Bot;
  bots: Bot[];
  conversationId: number;
  latestEntryId: number;
  queued: ClientTypes.ChatQueued[];
  quote?: ClientTypes.MentionItem;
  prefill?: string;
  isBusy: boolean;
  replyTo: ClientTypes.ChatMessage | null;
  unread: number;
  onUnreadPress: () => void;
  onReplyClear: () => void;
  onOutgoingChange: Dispatch<SetStateAction<ClientTypes.ChatOutgoing[]>>;
  onSend: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

export function ChatComposer({
  session,
  bot,
  bots,
  conversationId,
  latestEntryId,
  queued,
  quote,
  prefill,
  isBusy,
  replyTo,
  unread,
  onUnreadPress,
  onReplyClear,
  onOutgoingChange,
  onSend,
  onLayout,
}: ChatComposerProps) {
  const router = useRouter();
  const toast = useToast();
  const [text, setText] = useState('');
  const [cursor, setCursor] = useState(0);
  const [picked, setPicked] = useState<ClientTypes.MentionItem[]>([]);
  const quoteKey = quote ? `${quote.href} ${quote.label}` : undefined;
  const [quotedKey, setQuotedKey] = useState<string>();
  const [prefilled, setPrefilled] = useState<string>();
  const files = useChatAttachments(session, bot.id);
  const submit = useMutation(session.rpc.conversation.submit.mutationOptions());
  const execute = useMutation(session.rpc.commands.execute.mutationOptions());
  const stop = useMutation(session.rpc.conversation.stop.mutationOptions({ onError: () => toast.show({ message: m.rooms_chat_stop_failed() }) }));

  const executed = useMutationState<MutationState<void, Error, CommandExecuteInput>>({
    filters: { mutationKey: session.rpc.commands.execute.mutationKey(), status: 'success' },
  });

  const resetAt = Math.max(0, ...executed
    .filter((command) => command.variables?.botId === bot.id && command.variables.name === 'reset')
    .map((command) => command.submittedAt));

  const [clearedAt, setClearedAt] = useState(resetAt);

  if (quoteKey !== quotedKey) {
    setQuotedKey(quoteKey);

    if (quote) {
      setText(`${text.trimEnd()}${text.trim() ? ' ' : ''}${quote.label} `);
      setPicked([...picked, quote]);
    }
  }

  if (resetAt > clearedAt) {
    setClearedAt(resetAt);
    setText('');
    setPicked([]);
  }

  if (prefill !== prefilled) {
    setPrefilled(prefill);

    if (prefill && !text.trim()) {
      setText(prefill);
      setCursor(prefill.length);
    }
  }

  const content = text.trim();
  const query = mentionQuery({ text, cursor });
  const hasFiles = files.readyIds.length > 0;
  const isStopping = isBusy && !content && files.attachments.length === 0;
  const isSendingFiles = submit.isPending && hasFiles;
  const canSend = (content !== '' || hasFiles) && !files.uploading && !isSendingFiles;

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

  function pick(item: ClientTypes.MentionItem) {
    const start = query?.start ?? cursor;
    const next = `${text.slice(0, start)}${item.label} ${text.slice(cursor)}`;

    setText(next);
    setCursor(start + item.label.length + 1);
    setPicked((items) => [...items, item]);
  }

  function attach() {
    ActionSheetIOS.showActionSheetWithOptions({
      options: [m.ui_cancel(), m.mobile_chat_attach_photos(), m.mobile_chat_attach_files()],
      cancelButtonIndex: 0,
    }, (index) => match(index)
      .with(1, () => void files.pickPhotos())
      .with(2, () => void files.pickFiles())
      .otherwise(() => undefined));
  }

  async function send() {
    const { content: message, skills, command } = mentionSubmission({ text: mentionLinks({ text: content, items: picked }) });
    const attachmentIds = files.readyIds;
    const replyToEntryId = replyTo?.metadata?.entryId;
    const draft = { text, picked };

    if (command?.name === 'reset') {
      router.push({ pathname: '/chat/[botId]/reset', params: { botId: bot.id, handoff: command.arguments || undefined } });

      return;
    }

    setText('');
    setPicked([]);

    if (command) {
      await execute.mutateAsync({
        botId: bot.id,
        conversationId,
        name: command.name,
        arguments: command.arguments || undefined,
      }).catch(() => {
        setText((current) => current || draft.text);
        setPicked((items) => (items.length > 0 ? items : draft.picked));
        toast.show({ message: m.rooms_chat_send_failed() });
      });

      return;
    }

    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    onReplyClear();
    onSend();

    if (message) {
      onOutgoingChange((items) => [...items, { requestId, botId: bot.id, text: message, afterEntryId: latestEntryId, createdAt: Date.now() }]);
    }

    try {
      const { submissionId } = await submit.mutateAsync({
        botId: bot.id,
        conversationId,
        requestId,
        content: message,
        attachmentIds,
        replyToEntryId,
        skills: skills.length > 0 ? skills : undefined,
      });

      files.clear(attachmentIds);
      onOutgoingChange((items) => items.map((item) => (item.requestId === requestId ? { ...item, submissionId } : item)));
    } catch {
      onOutgoingChange((items) => items.filter((item) => item.requestId !== requestId));
      setText((current) => current || draft.text);
      setPicked((items) => (items.length > 0 ? items : draft.picked));
      toast.show({ message: m.rooms_chat_send_failed() });
    }
  }

  function handlePress() {
    match({ isStopping, canSend })
      .with({ isStopping: true }, () => stop.mutate({ botId: bot.id, conversationId }))
      .with({ canSend: false }, () => undefined)
      .otherwise(() => void send());
  }

  const hasDrawer = queued.length > 0 || replyTo !== null;

  const drawer = (
    <>
      {unread > 0 ? <PromptJump onPress={onUnreadPress}>{m.mobile_chat_unread({ count: unread })}</PromptJump> : null}
      {query ? (
        <ChatMentions
          bot={bot}
          bots={bots}
          query={query}
          session={session}
          onPick={pick}
        />
      ) : null}
      {hasDrawer ? (
        <PromptDrawer>
          <ChatQueue
            botId={bot.id}
            botName={bot.name}
            conversationId={conversationId}
            queued={queued}
          />
          {replyTo ? (
            <PromptQuote removeLabel={m.rooms_chat_reply_clear()} onRemove={onReplyClear}>
              {m.rooms_chat_replying({ name: replyTo.metadata?.authorName ?? '', text: roomsMessageText(replyTo) })}
            </PromptQuote>
          ) : null}
        </PromptDrawer>
      ) : null}
    </>
  );

  const attachments = files.attachments.length > 0 ? (
    <PromptAttachments>
      {files.attachments.map((item) => (
        <PromptAttachment
          key={item.key}
          name={item.name}
          preview={item.preview || undefined}
          removeLabel={m.rooms_files_remove()}
          retryLabel={m.mobile_chat_attach_retry()}
          status={item.status}
          onRemove={() => files.remove(item.key)}
          onRetry={() => files.retry(item.key)}
        />
      ))}
    </PromptAttachments>
  ) : null;

  return (
    <PromptDock drawer={drawer} onLayout={onLayout}>
      <GlassButton
        accessibilityLabel={m.rooms_chat_attach()}
        disabled={files.isFull}
        onPress={attach}
      >
        <Icon icon={Plus} size="action" />
      </GlassButton>
      <View className="flex-1">
        <PromptField
          accessibilityLabel={m.rooms_chat_placeholder()}
          actions={(
            <Button
              accessibilityLabel={action.label}
              disabled={!isStopping && !canSend}
              size="icon-sm"
              variant="default"
              onPress={handlePress}
            >
              {action.icon}
            </Button>
          )}
          header={attachments}
          placeholder={m.rooms_chat_placeholder()}
          onChangeText={setText}
          onSelectionChange={(event) => setCursor(event.nativeEvent.selection.end)}
        >
          {mentionSegments({ text: mentionLinks({ text, items: picked }) }).map((segment, index) => match(segment)
            .with({ kind: 'pill' }, ({ item }) => <PromptMention key={index}>{item.label}</PromptMention>)
            .otherwise((part) => part.text))}
        </PromptField>
      </View>
    </PromptDock>
  );
}
