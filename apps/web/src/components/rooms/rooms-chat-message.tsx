import { toolBlocks } from '@repo/client/client';
import { useChatHideVerbose } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { isFileUIPart } from 'ai';
import { Fragment, useState } from 'react';
import { match } from 'ts-pattern';
import { RoomsChatActions } from '@/components/rooms/rooms-chat-actions';
import { RoomsChatArtifact } from '@/components/rooms/rooms-chat-artifact';
import { RoomsChatEvents } from '@/components/rooms/rooms-chat-events';
import { RoomsChatFailure } from '@/components/rooms/rooms-chat-failure';
import { RoomsChatFiles } from '@/components/rooms/rooms-chat-files';
import { RoomsChatMention } from '@/components/rooms/rooms-chat-mention';
import { RoomsChatReasoning } from '@/components/rooms/rooms-chat-reasoning';
import { RoomsChatSubagent } from '@/components/rooms/rooms-chat-subagent';
import { RoomsChatTools } from '@/components/rooms/rooms-chat-tools';
import { EventList } from '@/components/ui/ai/event';
import { Message, MessageClamp, MessageContent, MessageStack } from '@/components/ui/ai/message';
import { Response } from '@/components/ui/ai/response';
import { useLongPress } from '@/hooks/use-long-press';
import { MENTION_ALLOWED_TAGS } from '@/services/mention/mention.constants';
import { mentionRemark } from '@/services/mention/mention.utils';
import type { ChatMessage, ToolBot } from '@repo/client/client';
import type * as ReactTypes from 'react';

const mentionComponents = { mention: RoomsChatMention };
const remarkPlugins = [mentionRemark()];

interface RoomsChatMessageProps {
  message: ChatMessage
  botId: string
  name: string
  bot?: ToolBot
  live?: boolean
  isCollapsible?: boolean
  hasActions?: boolean
  reacting?: boolean
  reactions?: ReactTypes.ReactNode
  onReply?: () => void
  onReact?: (emoji: string) => void
}

export function RoomsChatMessage({
  message,
  botId,
  name,
  bot,
  live = false,
  isCollapsible = false,
  hasActions = false,
  reacting = false,
  reactions,
  onReply,
  onReact,
}: RoomsChatMessageProps) {
  const reply = message.metadata?.replyTo;
  const [sheet, setSheet] = useState(false);
  const press = useLongPress(() => setSheet(true));

  const { hideVerbose } = useChatHideVerbose();
  const blocks = toolBlocks({ parts: message.parts, hideVerbose });
  const files = message.parts.filter(isFileUIPart);
  const standalone = (block: typeof blocks[number] | undefined) => block?.kind === 'tools' || block?.kind === 'events' || block?.kind === 'reasoning' || block?.kind === 'failure';
  const bubbleBlocks = blocks.filter((block) => !standalone(block));
  const firstText = blocks.find((block) => block.kind === 'text');
  const actionsBlock = blocks.filter((block) => block.kind === 'text').at(-1) ?? bubbleBlocks.at(-1);

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
      <div className="relative min-w-0 flex-1">
        {content}
        {reactions ? <div className="absolute -top-3 -right-2.5 z-10 group-data-[role=user]:right-auto group-data-[role=user]:-left-2.5">{reactions}</div> : null}
      </div>
      <div className="pointer-fine:absolute pointer-fine:top-1/2 pointer-fine:-translate-y-1/2 group-data-[role=assistant]:pointer-fine:left-full group-data-[role=assistant]:pointer-fine:ml-2 group-data-[role=user]:pointer-fine:right-full group-data-[role=user]:pointer-fine:mr-2">
        {actions}
      </div>
    </div>
  );

  const filesView = files.length > 0 ? <RoomsChatFiles botId={botId} files={files} /> : null;
  const filesContent = filesView && !actionsBlock && (actions || reactions) ? withActions(filesView) : filesView;

  return segments.map((segment) => {
    const first = segment.at(0);

    const event = match(first)
      .with({ kind: 'tools' }, (tools) => <RoomsChatTools parts={tools.parts} />)
      .with({ kind: 'reasoning' }, (reasoning) => (
        <RoomsChatReasoning
          bot={bot ?? { name }}
          isStreaming={live ? reasoning.parts.some((part) => part.state === 'streaming') : false}
          text={reasoning.parts.map((part) => part.text).join('\n\n')}
        />
      ))
      .with({ kind: 'failure' }, (failure) => <RoomsChatFailure bot={bot ?? { name }} detail={failure.text} />)
      .otherwise(() => null);

    if (event) {
      return <EventList key={`${message.id}-${first?.index}`}>{event}</EventList>;
    }

    if (first?.kind === 'events') {
      return (
        <RoomsChatEvents
          events={first.events}
          key={`${message.id}-${first.index}`}
          senderId={botId}
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
              .with({ kind: 'tools' }, { kind: 'events' }, { kind: 'reasoning' }, { kind: 'failure' }, () => null)
              .with({ kind: 'artifact' }, (artifact) => <RoomsChatArtifact artifact={artifact.artifact} />)
              .with({ kind: 'subagent' }, (subagent) => (
                <RoomsChatSubagent
                  bot={bot ?? { name }}
                  botId={botId}
                  part={subagent.part}
                  subagent={subagent.subagent}
                />
              ))
              .with({ kind: 'text' }, (text) => {
                const textContent = (
                  <>
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
                  </>
                );

                return (
                  <MessageContent data-quote-id={message.id}>
                    {isCollapsible ? (
                      <MessageClamp
                        collapseLabel={m.rooms_chat_read_less()}
                        expandLabel={m.rooms_chat_read_more()}
                        id={`${botId}:${key}`}
                      >
                        {textContent}
                      </MessageClamp>
                    ) : textContent}
                  </MessageContent>
                );
              })
              .exhaustive();

            return (
              <Fragment key={key}>
                {block === actionsBlock && (actions || reactions) ? withActions(content) : content}
              </Fragment>
            );
          })}
        </MessageStack>
      </Message>
    );
  });
}
