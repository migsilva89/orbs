import { toolBlocks } from '@openbots/client/client';
import { useChatShowTools } from '@openbots/client/web';
import { m } from '@openbots/i18n/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { isFileUIPart } from 'ai';
import { Fragment, useState } from 'react';
import { match } from 'ts-pattern';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { RoomsChatActions } from '@/components/rooms/rooms-chat-actions';
import { RoomsChatArtifact } from '@/components/rooms/rooms-chat-artifact';
import { RoomsChatFiles } from '@/components/rooms/rooms-chat-files';
import { RoomsChatMention } from '@/components/rooms/rooms-chat-mention';
import { RoomsChatSubagent } from '@/components/rooms/rooms-chat-subagent';
import { RoomsChatTools } from '@/components/rooms/rooms-chat-tools';
import { Message, MessageContent, MessageStack } from '@/components/ui/ai/message';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ui/ai/reasoning';
import { Response } from '@/components/ui/ai/response';
import { useLongPress } from '@/hooks/use-long-press';
import { MENTION_ALLOWED_TAGS } from '@/services/mention/mention.constants';
import { mentionRemark } from '@/services/mention/mention.utils';
import { rpc } from '@/services/rpc/rpc.client';
import type { ChatActivity, ChatMessage, ToolBot } from '@openbots/client/client';
import type * as ReactTypes from 'react';

const mentionComponents = { mention: RoomsChatMention };

interface RoomsChatMessageProps {
  message: ChatMessage
  botId: string
  name: string
  bot?: ToolBot
  activity?: ChatActivity
  live?: boolean
  hasActions?: boolean
  reacting?: boolean
  onReply?: () => void
  onReact?: (emoji: string) => void
}

export function RoomsChatMessage({ message, botId, name, bot, activity = 'idle', live = false, hasActions = false, reacting = false, onReply, onReact }: RoomsChatMessageProps) {
  const reply = message.metadata?.replyTo;
  const [sheet, setSheet] = useState(false);
  const press = useLongPress(() => setSheet(true));
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const remarkPlugins = [mentionRemark({ bots })];

  const { shown: showTools } = useChatShowTools();
  const blocks = toolBlocks({ parts: message.parts }).filter((block) => showTools || block.kind !== 'tools');
  const files = message.parts.filter(isFileUIPart);
  const standalone = (block: typeof blocks[number] | undefined) => block?.kind === 'tools';
  const bubbleBlocks = blocks.filter((block) => !standalone(block));
  const firstText = blocks.find((block) => block.kind === 'text');
  const namedBlock = message.role === 'assistant' ? bubbleBlocks.find((block) => block.kind !== 'reasoning') : undefined;
  const actionsBlock = blocks.filter((block) => block.kind === 'text').at(-1) ?? bubbleBlocks.filter((block) => block.kind !== 'reasoning').at(-1);

  const segments: typeof blocks[] = files.length > 0 && bubbleBlocks.length === 0 ? [[]] : [];

  for (const block of blocks) {
    const last = segments.at(-1);

    if (standalone(block) || !last || standalone(last[0])) {
      segments.push([block]);
    } else {
      last.push(block);
    }
  }

  const bubbles = segments.filter((segment) => !standalone(segment[0]));
  const lastBubble = bubbles.at(-1);

  const actions = hasActions ? (
    <RoomsChatActions
      message={message}
      reacting={reacting}
      selectable={firstText !== undefined}
      sheet={sheet}
      onReact={onReact}
      onReply={onReply}
      onSheetChange={setSheet}
    />
  ) : null;

  const withActions = (content: ReactTypes.ReactNode) => (
    <div className="relative flex w-fit max-w-full items-center gap-2 group-data-[role=user]:flex-row-reverse has-[[data-message-wide]]:w-full">
      <div className="min-w-0 flex-1">{content}</div>
      <div className="pointer-fine:absolute pointer-fine:top-1/2 pointer-fine:-translate-y-1/2 group-data-[role=assistant]:pointer-fine:left-full group-data-[role=assistant]:pointer-fine:ml-2 group-data-[role=user]:pointer-fine:right-full group-data-[role=user]:pointer-fine:mr-2">
        {actions}
      </div>
    </div>
  );

  const avatar = message.role === 'user' ? null : (
    <BotAvatar
      activity={activity}
      animate={live}
      bot={bot ?? { name }}
    />
  );

  const filesView = files.length > 0 ? <RoomsChatFiles botId={botId} files={files} /> : null;
  const filesContent = filesView && !actionsBlock && actions ? withActions(filesView) : filesView;

  return segments.map((segment) => {
    const first = segment.at(0);

    if (first?.kind === 'tools') {
      return (
        <RoomsChatTools
          key={`${message.id}-${first.index}`}
          live={live}
          parts={first.parts}
        />
      );
    }

    return (
      <Message from={message.role} key={`${message.id}-${first?.index ?? 'files'}`}>
        <MessageStack className={hasActions ? 'pointer-coarse:select-none' : undefined} {...(hasActions ? press : {})}>
          {segment === bubbles.at(0) ? filesContent : null}
          {segment.map((block) => {
            const key = `${message.id}-${block.index}`;

            const content = match(block)
              .with({ kind: 'tools' }, () => null)
              .with({ kind: 'reasoning' }, (reasoning) => (
                <Reasoning isStreaming={live ? reasoning.parts.some((part) => part.state === 'streaming') : false}>
                  <ReasoningTrigger botName={name} />
                  <ReasoningContent>{reasoning.parts.map((part) => part.text).join('\n\n')}</ReasoningContent>
                </Reasoning>
              ))
              .with({ kind: 'failure' }, (failure) => <p className="px-4 text-xs text-destructive" role="alert">{failure.text}</p>)
              .with({ kind: 'artifact' }, (artifact) => <RoomsChatArtifact artifact={artifact.artifact} />)
              .with({ kind: 'subagent' }, (subagent) => (
                <RoomsChatSubagent
                  bot={bot ?? { name }}
                  botId={botId}
                  part={subagent.part}
                  subagent={subagent.subagent}
                />
              ))
              .with({ kind: 'text' }, (text) => (
                <MessageContent data-quote-id={message.id} tail={block === lastBubble?.at(-1)}>
                  {block === firstText && reply ? <span className="line-clamp-2 border-l-2 border-current/40 pl-2 text-xs opacity-80">{m.rooms_chat_reply_quote({ name: reply.authorName, text: reply.text })}</span> : null}
                  {text.parts.map((part, index) => (
                    <Response
                      allowedTags={MENTION_ALLOWED_TAGS}
                      components={mentionComponents}
                      isAnimating={live ? part.state === 'streaming' : false}
                      key={`${key}-${index}`}
                      remarkPlugins={remarkPlugins}
                      renderHtml={message.role === 'assistant'}
                    >
                      {part.text}
                    </Response>
                  ))}
                </MessageContent>
              ))
              .exhaustive();

            return (
              <Fragment key={key}>
                {block === namedBlock ? (
                  <span className="flex items-center gap-1 px-4 text-xs font-medium text-muted-foreground">{name}</span>
                ) : null}
                {block === actionsBlock && actions ? withActions(content) : content}
              </Fragment>
            );
          })}
        </MessageStack>
        {segment === lastBubble ? avatar : <span aria-hidden="true" className="size-8 shrink-0" />}
      </Message>
    );
  });
}
