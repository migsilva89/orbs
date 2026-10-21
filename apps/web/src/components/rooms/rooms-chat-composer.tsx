import { chatResetCommand, mentionHref, mentionSegments, ROOMS, roomsMessageText } from '@openbots/client/client';
import { useChatSend } from '@openbots/client/react';
import { useChatAttachmentsWeb, useChatDraft } from '@openbots/client/web';
import { ATTACHMENT } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { match, P } from 'ts-pattern';
import { RoomsChatAttachments } from '@/components/rooms/rooms-chat-attachments';
import { RoomsChatQueue } from '@/components/rooms/rooms-chat-queue';
import { RoomsMention } from '@/components/rooms/rooms-mention';
import { RoomsMentionOption } from '@/components/rooms/rooms-mention-option';
import { PromptInput, PromptInputActionMenu, PromptInputActionMenuContent, PromptInputActionMenuItem, PromptInputActionMenuTrigger, PromptInputQuote, PromptInputSubmit } from '@/components/ui/ai/prompt-input';
import { InputGroupAddon } from '@/components/ui/input-group';
import { useMessageScroller } from '@/components/ui/message-scroller';
import { toasty } from '@/components/ui/sonner';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useIsTouch } from '@/hooks/use-is-touch';
import { usePreferences } from '@/hooks/use-preferences';
import { rpc } from '@/services/rpc/rpc.client';
import IconPaperclip from '~icons/lucide/paperclip';
import type { PromptInputEditorHandle } from '@/components/ui/ai/prompt-input-editor';
import type * as ClientTypes from '@openbots/client/client';
import type { Bot } from '@openbots/contracts/universal';
import type { Dispatch, RefObject, SetStateAction } from 'react';

const PromptInputEditor = lazy(() => import('@/components/ui/ai/prompt-input-editor').then((module) => ({ default: module.PromptInputEditor })));

interface RoomsChatComposerProps {
  bot: Bot
  bots: Bot[]
  conversationId: number
  messages: ClientTypes.ChatMessage[]
  queued: ClientTypes.ChatQueued[]
  isBusy: boolean
  isCompacting: boolean
  latestEntryId: number
  editor: RefObject<PromptInputEditorHandle | null>
  replyTo: ClientTypes.ChatMessage | null
  onReplyChange: Dispatch<SetStateAction<ClientTypes.ChatMessage | null>>
  onOutgoingChange: Dispatch<SetStateAction<ClientTypes.ChatOutgoing[]>>
  onSend?: () => void
}

export function RoomsChatComposer({
  bot,
  bots,
  conversationId,
  messages,
  queued,
  isBusy,
  isCompacting,
  latestEntryId,
  editor,
  replyTo,
  onReplyChange,
  onOutgoingChange,
  onSend,
}: RoomsChatComposerProps) {
  const queryClient = useQueryClient();
  const scroller = useMessageScroller();
  const isMobile = useIsMobile();
  const isTouch = useIsTouch();
  const { preferences } = usePreferences();
  const files = useChatAttachmentsWeb({ botId: bot.id, onProblem: (message) => toasty(message, '⚠️') });
  const fileInput = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [skillsRequested, setSkillsRequested] = useState(false);
  const [commandsRequested, setCommandsRequested] = useState(false);
  const draft = useChatDraft(bot.id);

  useEffect(() => {
    const restore = (event: Event) => match(event)
      .with(P.instanceOf(CustomEvent<ClientTypes.RoomsPrefill>), ({ detail }) => match(detail.botId === bot.id)
        .with(true, () => editor.current?.restore(mentionSegments({ text: detail.text })))
        .with(false, () => undefined)
        .exhaustive())
      .otherwise(() => undefined);

    window.addEventListener(ROOMS.prefillEvent, restore);

    return () => window.removeEventListener(ROOMS.prefillEvent, restore);
  }, [bot.id, editor]);

  const navigate = useNavigate();

  const chat = useChatSend({
    botId: bot.id,
    conversationId,
    latestEntryId,
    onOutgoingChange,
    onResetDone: () => {
      editor.current?.restore([]);
      draft.save('');
    },
  });

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
  const isSendingFiles = chat.isSending && files.readyIds.length > 0;

  const submitStatus = match({ isStopping, isSendFailed: chat.isSendFailed })
    .with({ isStopping: true }, () => 'streaming' as const)
    .with({ isSendFailed: true }, () => 'error' as const)
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

  return (
    <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-4 keyboard:pb-1">
      <PromptInput
        key={bot.id}
        onDragOver={files.onDragOver}
        onDrop={files.onDrop}
        onPaste={files.onPaste}
        onSubmit={({ text: value }) => {
          if (isCompacting || files.uploading || isSendingFiles) {
            return false;
          }

          if (!value.trim() && files.readyIds.length === 0) {
            if (isBusy) {
              chat.stop();
            }

            return false;
          }

          if (Object.hasOwn(globalThis, 'Notification') && Notification.permission === 'default' && !window.__electrobunSendToHost) {
            void Notification.requestPermission();
          }

          const reset = chatResetCommand(value);

          if (reset) {
            void navigate({
              to: '/rooms/direct/$handle/reset',
              params: { handle: bot.handle },
              search: reset,
            });

            return false;
          }

          onSend?.();
          scroller.scrollToEnd({ behavior: 'smooth' });
          draft.save('');

          const attachmentIds = files.readyIds;
          const replyToEntryId = replyTo?.metadata?.entryId;
          const restore = () => editor.current?.restore(mentionSegments({ text: value }));

          void chat.send({
            text: value,
            attachmentIds,
            replyToEntryId,
          }).then((result) => match(result)
            .with({ kind: 'sent' }, () => {
              files.clear(attachmentIds);
              onReplyChange((current) => (current?.metadata?.entryId === replyToEntryId ? null : current));
            })
            .otherwise(() => undefined), restore);

          return true;
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
        <Suspense fallback={<div aria-hidden className="h-11 min-w-0 flex-1" />}>
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
                char: '@',
                empty: m.rooms_mention_bots_empty(),
                items: (query) => bots
                  .filter((peer) => peer.id !== bot.id && `${peer.name} ${peer.handle}`.toLowerCase().includes(query.toLowerCase()))
                  .map((peer) => ({ href: mentionHref({ kind: 'bot', name: peer.id }), label: `@${peer.handle}` })),
              },
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
              setText(value);
              draft.save(value);
            }}
          />
        </Suspense>
        <InputGroupAddon align="inline-end">
          <PromptInputSubmit
            aria-label={isStopping ? m.rooms_chat_stop() : m.rooms_chat_send()}
            disabled={isCompacting || files.uploading || isSendingFiles || (!isBusy && !text.trim() && files.readyIds.length === 0)}
            status={submitStatus}
            title={isStopping ? m.rooms_chat_stop() : m.rooms_chat_send()}
          />
        </InputGroupAddon>
      </PromptInput>
    </div>
  );
}
