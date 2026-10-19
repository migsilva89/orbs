import { ATTACHMENT } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateId } from 'ai';
import { lazy, useRef, useState } from 'react';
import { match } from 'ts-pattern';
import { RoomsChatAttachments } from '@/components/rooms/rooms-chat-attachments';
import { RoomsChatQueue } from '@/components/rooms/rooms-chat-queue';
import { RoomsMention } from '@/components/rooms/rooms-mention';
import { RoomsMentionOption } from '@/components/rooms/rooms-mention-option';
import { PromptInput, PromptInputActionMenu, PromptInputActionMenuContent, PromptInputActionMenuItem, PromptInputActionMenuTrigger, PromptInputQuote, PromptInputSubmit } from '@/components/ui/ai/prompt-input';
import { InputGroupAddon } from '@/components/ui/input-group';
import { useMessageScroller } from '@/components/ui/message-scroller';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useIsTouch } from '@/hooks/use-is-touch';
import { usePreferences } from '@/hooks/use-preferences';
import { useRoomAttachments } from '@/hooks/use-room-attachments';
import { useRoomDraft } from '@/hooks/use-room-draft';
import { mentionHref, mentionSegments, mentionSubmission } from '@/services/mention/mention.client';
import { roomsMessageText } from '@/services/rooms/rooms.client';
import { rpc } from '@/services/rpc/rpc.client';
import IconPaperclip from '~icons/lucide/paperclip';
import type { PromptInputEditorHandle } from '@/components/ui/ai/prompt-input-editor';
import type { ChatMessage, ChatQueued } from '@/types/chat.types';
import type { Bot } from '@openbots/contracts/universal';
import type { Dispatch, RefObject, SetStateAction } from 'react';

const PromptInputEditor = lazy(() => import('@/components/ui/ai/prompt-input-editor').then((module) => ({ default: module.PromptInputEditor })));

interface RoomsChatComposerProps {
  bot: Bot
  conversationId: number
  messages: ChatMessage[]
  queued: ChatQueued[]
  isBusy: boolean
  isCompacting: boolean
  text: string
  editor: RefObject<PromptInputEditorHandle | null>
  replyTo: ChatMessage | null
  onTextChange: (text: string) => void
  onReplyChange: Dispatch<SetStateAction<ChatMessage | null>>
  onSend?: () => void
}

export function RoomsChatComposer({
  bot,
  conversationId,
  messages,
  queued,
  isBusy,
  isCompacting,
  text,
  editor,
  replyTo,
  onTextChange,
  onReplyChange,
  onSend,
}: RoomsChatComposerProps) {
  const queryClient = useQueryClient();
  const scroller = useMessageScroller();
  const isMobile = useIsMobile();
  const isTouch = useIsTouch();
  const { preferences } = usePreferences();
  const files = useRoomAttachments(bot.id);
  const fileInput = useRef<HTMLInputElement>(null);
  const pendingRequest = useRef<{ key: string, id: string } | null>(null);
  const [skillsRequested, setSkillsRequested] = useState(false);
  const [commandsRequested, setCommandsRequested] = useState(false);
  const draft = useRoomDraft(bot.id);
  const submit = useMutation(rpc.conversation.submit.mutationOptions());
  const execute = useMutation(rpc.commands.execute.mutationOptions());
  const stop = useMutation(rpc.conversation.stop.mutationOptions());
  const skillsOptions = rpc.skills.discover.queryOptions({ input: { botId: bot.id } });
  const commandsOptions = rpc.commands.list.queryOptions({ input: { botId: bot.id } });

  const skills = useQuery({
    ...skillsOptions,
    retry: false,
    enabled: skillsRequested,
  });

  const commands = useQuery({
    ...commandsOptions,
    retry: false,
    enabled: commandsRequested,
  });

  const isStopping = isBusy && !text.trim() && files.attachments.length === 0;

  const submitStatus = match({ isStopping, submit })
    .with({ isStopping: true }, () => 'streaming' as const)
    .with({ submit: { isPending: true } }, () => 'submitted' as const)
    .with({ submit: { isError: true } }, () => 'error' as const)
    .otherwise(() => 'ready' as const);

  const skillsEmpty = match(skills)
    .with({ isPending: true }, () => m.rooms_mention_skills_loading())
    .with({ isError: true }, () => m.rooms_mention_skills_offline())
    .otherwise(() => m.rooms_mention_skills_empty());

  const commandsEmpty = match(commands)
    .with({ isPending: true }, () => m.rooms_mention_commands_loading())
    .with({ isError: true }, () => m.rooms_mention_skills_offline())
    .otherwise(() => m.rooms_mention_commands_empty());

  const recall = () => {
    const sent = messages.filter((message) => message.role === 'user').at(-1);

    return sent ? mentionSegments({ text: roomsMessageText(sent) }) : null;
  };

  async function send(value: string) {
    const { content, skills: chosen, command } = mentionSubmission({ text: value });

    if (command) {
      await execute.mutateAsync({
        botId: bot.id,
        conversationId,
        name: command.name,
        arguments: command.arguments || undefined,
      });

      return;
    }

    const attachmentIds = files.readyIds;
    const replyToEntryId = replyTo?.metadata?.entryId;

    const key = JSON.stringify({
      content,
      chosen,
      attachmentIds,
      replyToEntryId,
    });

    const pending = pendingRequest.current?.key === key ? pendingRequest.current : { key, id: generateId() };
    pendingRequest.current = pending;

    await submit.mutateAsync({
      botId: bot.id,
      conversationId,
      requestId: pending.id,
      content,
      attachmentIds,
      replyToEntryId,
      skills: chosen.length > 0 ? chosen : undefined,
      whenBusy: preferences.whenBusy,
    });

    pendingRequest.current = null;
    files.clear(attachmentIds);
    onReplyChange((current) => (current?.metadata?.entryId === replyToEntryId ? null : current));
  }

  return (
    <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-4 keyboard:pb-1">
      <PromptInput
        key={bot.id}
        onDragOver={files.onDragOver}
        onDrop={files.onDrop}
        onPaste={files.onPaste}
        onSubmit={async ({ text: value }) => {
          if (isCompacting || files.uploading) {
            return false;
          }

          if (!value.trim() && files.readyIds.length === 0) {
            if (isBusy) {
              stop.mutate({ botId: bot.id, conversationId });
            }

            return false;
          }

          if (Object.hasOwn(globalThis, 'Notification') && Notification.permission === 'default' && !window.__electrobunSendToHost) {
            void Notification.requestPermission();
          }

          onSend?.();
          scroller.scrollToEnd({ behavior: 'smooth' });
          draft.save('');

          try {
            await send(value);

            return true;
          } catch {
            draft.save(value);

            return false;
          }
        }}
      >
        <RoomsChatQueue
          botId={bot.id}
          botName={bot.name}
          conversationId={conversationId}
          queued={queued}
        />
        <RoomsChatAttachments files={files} />
        {replyTo ? (
          <PromptInputQuote removeLabel={m.rooms_chat_reply_clear()} onRemove={() => onReplyChange(null)}>
            {m.rooms_chat_replying({ name: replyTo.metadata?.authorName ?? '', text: roomsMessageText(replyTo) })}
          </PromptInputQuote>
        ) : null}
        <InputGroupAddon align="inline-start">
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger
              aria-label={m.rooms_chat_attach()}
              title={m.rooms_chat_attach()}
              variant="secondary"
            />
            <PromptInputActionMenuContent>
              <PromptInputActionMenuItem disabled={files.attachments.length >= ATTACHMENT.maxPerMessage} onSelect={() => fileInput.current?.click()}>
                <IconPaperclip />
                {m.rooms_chat_attach()}
              </PromptInputActionMenuItem>
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
          <input
            hidden
            multiple
            accept={ATTACHMENT.mediaTypes.join(',')}
            ref={fileInput}
            type="file"
            onChange={(event) => {
              files.add([...(event.currentTarget.files ?? [])]);
              event.currentTarget.value = '';
            }}
          />
        </InputGroupAddon>
        <PromptInputEditor
          aria-label={m.rooms_chat_placeholder()}
          disabled={isCompacting}
          enterSends={preferences.enterKey[isTouch ? 'mobile' : 'desktop'] === 'send'}
          focusOnMount={!isMobile}
          initialContent={draft.draft ? mentionSegments({ text: draft.draft }) : undefined}
          placeholder={isCompacting ? m.rooms_chat_compacting_wait() : m.rooms_chat_placeholder()}
          recall={recall}
          ref={editor}
          renderItem={(item) => (
            <RoomsMentionOption
              commands={commands.data ?? []}
              href={item.href}
              label={item.label}
              skills={skills.data ?? []}
            />
          )}
          renderMention={(item) => <RoomsMention href={item.href} label={item.label} />}
          triggers={[
            {
              char: '$',
              empty: skillsEmpty,
              items: async (query) => {
                setSkillsRequested(true);

                const available = await queryClient.fetchQuery({ ...skillsOptions, retry: false }).catch(() => []);

                return available
                  .filter((skill) => `${skill.name} ${skill.description}`.toLowerCase().includes(query.toLowerCase()))
                  .map((skill) => ({ href: mentionHref({ kind: 'skill', name: skill.name }), label: `$${skill.name}` }));
              },
            },
            {
              char: '/',
              empty: commandsEmpty,
              items: async (query) => {
                setCommandsRequested(true);

                const available = await queryClient.fetchQuery({ ...commandsOptions, retry: false }).catch(() => []);

                return available
                  .filter((command) => `${command.name} ${command.description}`.toLowerCase().includes(query.toLowerCase()))
                  .sort((first, second) => Number(!first.name.startsWith(query.toLowerCase())) - Number(!second.name.startsWith(query.toLowerCase())))
                  .map((command) => ({ href: mentionHref({ kind: 'command', name: command.name }), label: `/${command.name}` }));
              },
            },
          ]}
          onTextChange={(value) => {
            onTextChange(value);
            draft.save(value);
          }}
        />
        <InputGroupAddon align="inline-end">
          <PromptInputSubmit
            aria-label={isStopping ? m.rooms_chat_stop() : m.rooms_chat_send()}
            disabled={isCompacting || files.uploading || (!isBusy && !text.trim() && files.readyIds.length === 0)}
            status={submitStatus}
            title={isStopping ? m.rooms_chat_stop() : m.rooms_chat_send()}
          />
        </InputGroupAddon>
      </PromptInput>
    </div>
  );
}
