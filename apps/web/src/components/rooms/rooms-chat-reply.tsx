import { useChatReaction } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { RoomsChatMessage } from '@/components/rooms/rooms-chat-message';
import { RoomsChatReactions } from '@/components/rooms/rooms-chat-reactions';
import type { RoomsReactionGroup } from '@openbots/client/client';
import type { ComponentProps } from 'react';

interface RoomsChatReplyProps extends Omit<ComponentProps<typeof RoomsChatMessage>, 'reacting' | 'onReact'> {
  groups: RoomsReactionGroup[]
}

export function RoomsChatReply({ groups, ...props }: RoomsChatReplyProps) {
  const entryId = props.message.metadata?.entryId ?? 0;
  const toggle = useChatReaction(props.botId);

  const react = (emoji: string) => toggle.react({
    entryId,
    emoji,
    groups,
  });

  const badges = groups.length > 0 ? (
    <RoomsChatReactions
      disabled={toggle.isPending}
      groups={groups}
      onToggle={entryId > 0 ? react : undefined}
    />
  ) : undefined;

  return (
    <>
      <RoomsChatMessage
        {...props}
        reacting={toggle.isPending}
        reactions={badges}
        onReact={entryId > 0 ? react : undefined}
      />
      {toggle.isError ? <p className="px-1 pb-1 text-xxs text-destructive" role="alert">{m.rooms_reaction_failed()}</p> : null}
    </>
  );
}
