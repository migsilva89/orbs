import { useQuery } from '@tanstack/react-query';
import { match, P } from 'ts-pattern';
import { ContextMenu, Menu } from '@/components/ui/menu';
import { useBotActions } from '@/hooks/use-bot-actions';
import { useConnection } from '@/hooks/use-connection';
import type { RpcSession } from '@/types/rpc.types';
import type { ConversationListItem } from '@openbots/contracts/universal';
import type { ReactElement } from 'react';

interface BotActionsMenuProps {
  botId: string;
  mode: 'press' | 'longPress';
  children: ReactElement;
  isFullWidth?: boolean;
}

export function BotActionsMenu(props: BotActionsMenuProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => <BotActionsMenuLoader {...props} session={current} />)
    .otherwise(() => props.children);
}

interface BotActionsMenuLoaderProps extends BotActionsMenuProps {
  session: RpcSession;
}

function BotActionsMenuLoader({ session, botId, ...props }: BotActionsMenuLoaderProps) {
  const chats = useQuery(session.rpc.conversation.list.queryOptions());

  return match(chats.data?.find((item) => item.botId === botId))
    .with(P.nonNullable, (chat) => (
      <BotActionsMenuContent
        {...props}
        chat={chat}
        session={session}
      />
    ))
    .otherwise(() => props.children);
}

interface BotActionsMenuContentProps extends Omit<BotActionsMenuProps, 'botId'> {
  session: RpcSession;
  chat: ConversationListItem;
}

function BotActionsMenuContent({ session, chat, mode, children, isFullWidth }: BotActionsMenuContentProps) {
  const items = useBotActions(session, chat);

  return match(mode)
    .with('press', () => <Menu items={items} title={chat.name}>{children}</Menu>)
    .with('longPress', () => (
      <ContextMenu
        isFullWidth={isFullWidth}
        items={items}
        title={chat.name}
      >
        {children}
      </ContextMenu>
    ))
    .exhaustive();
}
