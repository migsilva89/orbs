import { useChatReaction } from '@openbots/client/react';
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

  return (
    <>
      <RoomsChatMessage
        {...props}
        reacting={toggle.isPending}
        onReact={entryId > 0 ? react : undefined}
      />
      <RoomsChatReactions
        disabled={toggle.isPending}
        failed={toggle.isError}
        groups={groups}
        onToggle={entryId > 0 ? react : undefined}
      />
    </>
  );
}
