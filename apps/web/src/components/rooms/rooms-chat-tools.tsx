import { TOOL_PEER_NAMES, toolCollapsed, toolGroupState, toolIdentity, toolOutputText, toolPeers, toolRunning } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Fragment, useState } from 'react';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { ToolInput } from '@/components/tools/tool-input';
import { ToolLabel } from '@/components/tools/tool-label';
import { Tool, ToolCode, ToolContent, ToolGroup, ToolGroupItem, ToolGroupToggle } from '@/components/ui/ai/tool';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Mention } from '@/components/ui/mention';
import { roomsPairLink } from '@/services/rooms/rooms.client';
import { rpc } from '@/services/rpc/rpc.client';
import type { DynamicToolUIPart } from 'ai';

interface RoomsChatToolsItemProps {
  part: DynamicToolUIPart
}

function RoomsChatToolsItem({ part }: RoomsChatToolsItemProps) {
  const [open, setOpen] = useState(false);
  const output = toolOutputText(part);

  return (
    <Tool open={open} onOpenChange={setOpen}>
      <ToolLabel part={part} />
      <ToolContent>
        <div className="flex min-w-0 flex-col gap-2">
          <ToolCode>{toolIdentity(part).identifier}</ToolCode>
          <ToolInput input={part.input} />
          {output ? <ToolCode variant={part.state === 'output-error' ? 'destructive' : 'default'}>{output}</ToolCode> : null}
        </div>
      </ToolContent>
    </Tool>
  );
}

interface RoomsChatToolsPeersProps {
  parts: DynamicToolUIPart[]
  senderId: string
}

function RoomsChatToolsPeers({ parts, senderId }: RoomsChatToolsPeersProps) {
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const sender = bots.find((item) => item.id === senderId);

  const peers = toolPeers(parts, bots);

  return (
    <p className="flex flex-wrap items-center justify-center gap-1 py-2 text-xs text-muted-foreground">
      {parts.length > 1 ? m.rooms_pair_messages({ count: parts.length }) : m.rooms_pair_messaged()}
      {peers.length > 2 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="outline-none" type="button">
              <Mention variant="plain">
                <span className="flex -space-x-1.5">
                  {peers.slice(0, 3).map(({ peer }) => (
                    <span className="rounded-full ring-2 ring-background" key={peer.id}>
                      <BotAvatar
                        animate={false}
                        bot={peer}
                        size={16}
                      />
                    </span>
                  ))}
                </span>
                {m.rooms_pair_bots({ count: peers.length })}
              </Mention>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {peers.map(({ peer, conversationId }) => (sender && conversationId !== undefined ? (
              <DropdownMenuItem asChild key={peer.id}>
                <Link
                  {...roomsPairLink({
                    sender,
                    peer,
                    conversationId,
                  })}
                >
                  <BotAvatar bot={peer} size={16} />
                  {peer.name}
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled key={peer.id}>
                <BotAvatar bot={peer} size={16} />
                {peer.name}
              </DropdownMenuItem>
            )))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : peers.map(({ peer, conversationId }, index) => (
        <Fragment key={peer.id}>
          {index > 0 ? <span>{index === peers.length - 1 ? m.rooms_pair_and() : ','}</span> : null}
          {sender && conversationId !== undefined ? (
            <Link
              {...roomsPairLink({
                sender,
                peer,
                conversationId,
              })}
            >
              <Mention variant="plain">
                <BotAvatar
                  animate={false}
                  bot={peer}
                  size={16}
                />
                {peer.name}
              </Mention>
            </Link>
          ) : (
            <span>
              <Mention variant="plain">
                <BotAvatar
                  animate={parts.some(toolRunning)}
                  bot={peer}
                  size={16}
                />
                {peer.name}
              </Mention>
            </span>
          )}
        </Fragment>
      ))}
    </p>
  );
}

interface RoomsChatToolsProps {
  parts: DynamicToolUIPart[]
  senderId: string
  live: boolean
}

export function RoomsChatTools({ parts, senderId, live }: RoomsChatToolsProps) {
  const [expanded, setExpanded] = useState(false);
  const peers = parts.filter((part) => TOOL_PEER_NAMES.has(part.toolName));
  const others = parts.filter((part) => !TOOL_PEER_NAMES.has(part.toolName));
  const grouped = others.length > 1;

  return (
    <>
      {peers.length > 0 ? <RoomsChatToolsPeers parts={peers} senderId={senderId} /> : null}
      {others.length > 0 ? (
        <ToolGroup>
          {grouped ? (
            <ToolGroupItem enter={live}>
              <ToolGroupToggle
                open={expanded}
                state={toolGroupState({ parts: others })}
                onClick={() => setExpanded(!expanded)}
              >
                {m.rooms_chat_tools_count({ count: others.length })}
              </ToolGroupToggle>
            </ToolGroupItem>
          ) : null}
          {others.map((part) => (
            <ToolGroupItem
              collapsed={toolCollapsed({
                part,
                grouped,
                expanded,
              })}
              enter={live}
              key={part.toolCallId}
            >
              <RoomsChatToolsItem part={part} />
            </ToolGroupItem>
          ))}
        </ToolGroup>
      ) : null}
    </>
  );
}
