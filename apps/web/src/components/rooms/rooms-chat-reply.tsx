import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RoomsChatMessage } from '@/components/rooms/rooms-chat-message';
import { RoomsChatReactions } from '@/components/rooms/rooms-chat-reactions';
import { rpc } from '@/services/rpc/rpc.client';
import type { RoomsReactionGroup } from '@openbots/client/client';
import type { ComponentProps } from 'react';

interface RoomsChatReplyProps extends Omit<ComponentProps<typeof RoomsChatMessage>, 'reacting' | 'onReact'> {
  groups: RoomsReactionGroup[]
}

export function RoomsChatReply({ groups, ...props }: RoomsChatReplyProps) {
  const queryClient = useQueryClient();
  const entryId = props.message.metadata?.entryId ?? 0;
  const queryKey = rpc.conversation.reactions.key();

  const toggle = useMutation(rpc.conversation.setReaction.mutationOptions({
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  }));

  const react = (emoji: string) => toggle.mutate({
    botId: props.botId,
    entryId,
    emoji,
    isPresent: !groups.some((group) => group.emoji === emoji && group.isMine),
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
