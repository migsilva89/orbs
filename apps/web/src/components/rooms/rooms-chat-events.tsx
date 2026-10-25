import { toolPeers, toolRunning } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Fragment } from 'react';
import { match } from 'ts-pattern';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Mention } from '@/components/ui/mention';
import { roomsPairLink } from '@/services/rooms/rooms.client';
import { rpc } from '@/services/rpc/rpc.client';
import IconAlarmClock from '~icons/lucide/alarm-clock';
import IconListTodo from '~icons/lucide/list-todo';
import type * as ClientTypes from '@repo/client/client';
import type { Bot } from '@repo/contracts/universal';
import type { DynamicToolUIPart } from 'ai';
import type { ReactNode } from 'react';

interface RoomsChatEventsLineProps {
  label: string
  isDeleted?: boolean
  children: ReactNode
}

function RoomsChatEventsLine({ label, isDeleted = false, children }: RoomsChatEventsLineProps) {
  return (
    <p className="flex flex-wrap items-center justify-center gap-1 py-1.5 text-sm text-muted-foreground">
      {label}
      {children}
      {isDeleted ? <span className="ml-1">{m.rooms_event_deleted()}</span> : null}
    </p>
  );
}

interface RoomsChatEventsPeersProps {
  parts: DynamicToolUIPart[]
  sender: Bot | undefined
}

function RoomsChatEventsPeers({ parts, sender }: RoomsChatEventsPeersProps) {
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const peers = toolPeers(parts, bots);

  return (
    <RoomsChatEventsLine label={parts.length > 1 ? m.rooms_pair_messages({ count: parts.length }) : m.rooms_pair_messaged()}>
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
    </RoomsChatEventsLine>
  );
}

interface RoomsChatEventsRoutineProps {
  event: ClientTypes.ToolEventRoutine
  senderId: string
  sender: Bot | undefined
}

function RoomsChatEventsRoutine({ event, senderId, sender }: RoomsChatEventsRoutineProps) {
  const routines = useQuery({ ...rpc.routines.list.queryOptions({ input: { botId: senderId } }), staleTime: 0 });
  const isRemoved = event.action === 'remove';
  const isDeleted = !isRemoved && routines.isSuccess && routines.isFetchedAfterMount && !routines.data.some((routine) => routine.id === event.routine.id);

  const label = match(event.action)
    .with('create', () => m.rooms_event_routine_create())
    .with('update', () => m.rooms_event_routine_update())
    .with('run', () => m.rooms_event_routine_run())
    .with('remove', () => m.rooms_event_routine_remove())
    .exhaustive();

  const chip = (
    <Mention variant="plain">
      <IconAlarmClock className="size-4 p-0.5" />
      {event.routine.name}
    </Mention>
  );

  return (
    <RoomsChatEventsLine isDeleted={isDeleted} label={label}>
      {sender && !isRemoved && !isDeleted ? <Link params={{ handle: sender.handle }} to="/rooms/direct/$handle/routines">{chip}</Link> : chip}
    </RoomsChatEventsLine>
  );
}

interface RoomsChatEventsTodoProps {
  event: ClientTypes.ToolEventTodo
  senderId: string
  sender: Bot | undefined
}

function RoomsChatEventsTodo({ event, senderId, sender }: RoomsChatEventsTodoProps) {
  const todos = useQuery({ ...rpc.todos.list.queryOptions({ input: { botId: senderId } }), staleTime: 0 });
  const isRemoved = event.action === 'remove';
  const isDeleted = !isRemoved && todos.isSuccess && todos.isFetchedAfterMount && !todos.data.some((todo) => todo.id === event.todo.id);

  const label = match(event.action)
    .with('create', () => m.rooms_event_todo_create())
    .with('update', () => m.rooms_event_todo_update())
    .with('complete', () => m.rooms_event_todo_complete())
    .with('remove', () => m.rooms_event_todo_remove())
    .exhaustive();

  const chip = (
    <Mention variant="plain">
      <IconListTodo className="size-4 p-0.5" />
      {event.todo.title}
    </Mention>
  );

  return (
    <RoomsChatEventsLine isDeleted={isDeleted} label={label}>
      {sender && !isRemoved && !isDeleted ? <Link params={{ handle: sender.handle }} to="/rooms/direct/$handle/todos">{chip}</Link> : chip}
    </RoomsChatEventsLine>
  );
}

interface RoomsChatEventsBotProps {
  event: ClientTypes.ToolEventBot
}

function RoomsChatEventsBot({ event }: RoomsChatEventsBotProps) {
  const bots = useQuery({ ...rpc.bots.list.queryOptions(), staleTime: 0 });
  const bot = bots.data?.find((item) => item.id === event.botId);
  const isDeleted = bots.isSuccess && bots.isFetchedAfterMount && !bot;

  const label = match(event.action)
    .with('create', () => m.rooms_event_bot_create())
    .with('update', () => m.rooms_event_bot_update())
    .with('models', () => m.rooms_event_bot_models())
    .exhaustive();

  const name = bot?.name ?? event.name;

  if (name === undefined) {
    return null;
  }

  const chip = (
    <Mention variant="plain">
      <BotAvatar
        animate={false}
        bot={bot ?? { name }}
        size={16}
      />
      {name}
    </Mention>
  );

  return (
    <RoomsChatEventsLine isDeleted={isDeleted} label={label}>
      {bot ? <Link params={{ handle: bot.handle }} to="/rooms/direct/$handle">{chip}</Link> : chip}
    </RoomsChatEventsLine>
  );
}

interface RoomsChatEventsProps {
  events: ClientTypes.ToolEvent[]
  senderId: string
}

export function RoomsChatEvents({ events, senderId }: RoomsChatEventsProps) {
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const sender = bots.find((item) => item.id === senderId);

  return (
    <div className="flex flex-col py-0.5">
      {events.map((event) => match(event)
        .with({ kind: 'peers' }, (peers) => (
          <RoomsChatEventsPeers
            key={peers.key}
            parts={peers.parts}
            sender={sender}
          />
        ))
        .with({ kind: 'routine' }, (routine) => (
          <RoomsChatEventsRoutine
            event={routine}
            key={routine.key}
            sender={sender}
            senderId={senderId}
          />
        ))
        .with({ kind: 'todo' }, (todo) => (
          <RoomsChatEventsTodo
            event={todo}
            key={todo.key}
            sender={sender}
            senderId={senderId}
          />
        ))
        .with({ kind: 'bot' }, (bot) => <RoomsChatEventsBot event={bot} key={bot.key} />)
        .exhaustive())}
    </div>
  );
}
