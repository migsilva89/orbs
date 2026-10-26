import { toolPeers, toolRunning } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Fragment } from 'react';
import { match } from 'ts-pattern';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { BotMention } from '@/components/bots/bot-mention';
import { EventLabel, EventLine, EventList, EventName } from '@/components/ui/ai/event';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';
import { roomsPairLink } from '@/services/rooms/rooms.client';
import { rpc } from '@/services/rpc/rpc.client';
import IconAlarmClock from '~icons/lucide/alarm-clock';
import IconAlarmClockCheck from '~icons/lucide/alarm-clock-check';
import IconAlarmClockOff from '~icons/lucide/alarm-clock-off';
import IconAlarmClockPlus from '~icons/lucide/alarm-clock-plus';
import IconCircleCheck from '~icons/lucide/circle-check';
import IconListPlus from '~icons/lucide/list-plus';
import IconListTodo from '~icons/lucide/list-todo';
import IconListX from '~icons/lucide/list-x';
import type * as ClientTypes from '@repo/client/client';
import type { Bot } from '@repo/contracts/universal';
import type { DynamicToolUIPart } from 'ai';
import type { ComponentType, ReactNode, SVGProps } from 'react';

const ROOMS_CHAT_EVENTS_ICONS = {
  'alarm-clock-plus': IconAlarmClockPlus,
  'alarm-clock': IconAlarmClock,
  'alarm-clock-check': IconAlarmClockCheck,
  'alarm-clock-off': IconAlarmClockOff,
  'list-plus': IconListPlus,
  'list-todo': IconListTodo,
  'circle-check': IconCircleCheck,
  'list-x': IconListX,
} satisfies Record<ClientTypes.ToolEventIcon, ComponentType<SVGProps<SVGSVGElement>>>;

interface RoomsChatEventsLineProps {
  label: string
  isDeleted?: boolean
  children: ReactNode
}

function RoomsChatEventsLine({ label, isDeleted = false, children }: RoomsChatEventsLineProps) {
  return (
    <EventLine>
      <EventLabel>{label}</EventLabel>
      {children}
      {isDeleted ? <EventLabel>{m.rooms_event_deleted()}</EventLabel> : null}
    </EventLine>
  );
}

interface RoomsChatEventsPanelLinkProps {
  handle: string
  panel: 'routines' | 'todos'
  children: ReactNode
}

function RoomsChatEventsPanelLink({ handle, panel, children }: RoomsChatEventsPanelLinkProps) {
  const { isMobile, setOpen, setOpenMobile } = useSidebar();

  return (
    <Link
      params={{ handle }}
      to={panel === 'routines' ? '/rooms/direct/$handle/routines' : '/rooms/direct/$handle/todos'}
      onClick={() => (isMobile ? setOpenMobile(true) : setOpen(true))}
    >
      {children}
    </Link>
  );
}

interface RoomsChatEventsPeersProps {
  parts: DynamicToolUIPart[]
  sender: Bot | undefined
}

function RoomsChatEventsPeers({ parts, sender }: RoomsChatEventsPeersProps) {
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const peers = toolPeers(parts, bots);

  const stack = peers.slice(0, 3).map(({ peer }) => (
    <BotAvatar
      animate={false}
      bot={peer}
      key={peer.id}
      size={16}
    />
  ));

  return (
    <RoomsChatEventsLine label={parts.length > 1 ? m.rooms_pair_messages({ count: parts.length }) : m.rooms_pair_messaged()}>
      {peers.length > 2 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring" type="button">
              <EventName icon={stack}>{m.rooms_pair_bots({ count: peers.length })}</EventName>
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
      ) : peers.map(({ peer, conversationId }, index) => {
        const isLinked = sender !== undefined && conversationId !== undefined;

        const name = <BotMention animate={!isLinked && parts.some(toolRunning)} bot={peer} />;

        return (
          <Fragment key={peer.id}>
            {index > 0 && index === peers.length - 1 ? <EventLabel>{m.rooms_pair_and()}</EventLabel> : null}
            {index > 0 && index < peers.length - 1 ? <EventLabel className="-ml-1.5">,</EventLabel> : null}
            {isLinked ? (
              <Link
                {...roomsPairLink({
                  sender,
                  peer,
                  conversationId,
                })}
              >
                {name}
              </Link>
            ) : <span>{name}</span>}
          </Fragment>
        );
      })}
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

  const Icon = ROOMS_CHAT_EVENTS_ICONS[event.icon];

  const chip = <EventName icon={<Icon />}>{event.routine.name}</EventName>;

  return (
    <RoomsChatEventsLine isDeleted={isDeleted} label={label}>
      {sender && !isRemoved && !isDeleted ? <RoomsChatEventsPanelLink handle={sender.handle} panel="routines">{chip}</RoomsChatEventsPanelLink> : chip}
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

  const Icon = ROOMS_CHAT_EVENTS_ICONS[event.icon];

  const chip = <EventName icon={<Icon />}>{event.todo.title}</EventName>;

  return (
    <RoomsChatEventsLine isDeleted={isDeleted} label={label}>
      {sender && !isRemoved && !isDeleted ? <RoomsChatEventsPanelLink handle={sender.handle} panel="todos">{chip}</RoomsChatEventsPanelLink> : chip}
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

  const chip = <BotMention bot={bot ?? { name }} />;

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
    <EventList>
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
    </EventList>
  );
}
