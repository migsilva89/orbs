import { botSkillName, mentionTarget } from '@repo/client/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { Mention } from '@/components/ui/mention';
import { rpc } from '@/services/rpc/rpc.client';
import IconBox from '~icons/lucide/box';
import IconQuote from '~icons/lucide/quote';
import IconSquareSlash from '~icons/lucide/square-slash';

interface RoomsMentionProps {
  href: string
  label: string
}

export function RoomsMention({ href, label }: RoomsMentionProps) {
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const target = mentionTarget({ href });

  if (target?.kind === 'quote') {
    return (
      <Mention title={label}>
        <IconQuote className="size-4 p-0.5" />
        <span className="max-w-48 truncate">{label}</span>
      </Mention>
    );
  }

  if (target?.kind === 'skill') {
    return (
      <Mention title={label} variant="skill">
        <IconBox className="size-3.5 p-0.5" />
        {botSkillName({ name: target.name })}
      </Mention>
    );
  }

  if (target?.kind === 'command') {
    return (
      <Mention title={label}>
        <IconSquareSlash className="size-4 p-0.5" />
        {target.name}
      </Mention>
    );
  }

  const bot = target?.kind === 'bot' ? bots.find((candidate) => candidate.id === target.name) : undefined;

  if (!bot) {
    return <Mention variant="muted">{label}</Mention>;
  }

  return (
    <Mention title={`@${bot.handle}`}>
      <BotAvatar
        animate={false}
        bot={bot}
        size={16}
      />
      {bot.name}
    </Mention>
  );
}
