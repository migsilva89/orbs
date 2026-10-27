import { botSkillName, mentionTarget } from '@repo/client/client';
import { BotAvatar } from '@repo/ui/bots/bot-avatar';
import { useSuspenseQuery } from '@tanstack/react-query';
import { rpc } from '@/services/rpc/rpc.client';
import IconBox from '~icons/lucide/box';
import IconSquareSlash from '~icons/lucide/square-slash';
import type { Command, Skill } from '@repo/contracts/universal';

interface RoomsMentionOptionProps {
  href: string
  label: string
  skills: Skill[]
  commands: Command[]
}

export function RoomsMentionOption({ href, label, skills, commands }: RoomsMentionOptionProps) {
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const target = mentionTarget({ href });
  const bot = target?.kind === 'bot' ? bots.find((candidate) => candidate.id === target.name) : undefined;
  const skill = target?.kind === 'skill' ? skills.find((candidate) => candidate.name === target.name) : undefined;
  const command = target?.kind === 'command' ? commands.find((candidate) => candidate.name === target.name) : undefined;

  if (bot) {
    return (
      <>
        <BotAvatar
          animate={false}
          bot={bot}
          size={20}
        />
        <span className="max-w-[45%] shrink-0 truncate font-medium">{bot.name}</span>
        <span className="min-w-0 flex-1 truncate text-muted-foreground">{bot.instructions}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </>
    );
  }

  return (
    <>
      {skill ? <IconBox className="size-5 shrink-0 p-1 text-muted-foreground/60" /> : <IconSquareSlash className="size-5 shrink-0 p-1 text-muted-foreground/60" />}
      <span className="max-w-[45%] shrink-0 truncate font-medium">{skill ? botSkillName({ name: skill.name }) : label}</span>
      <span className="min-w-0 flex-1 truncate text-muted-foreground">{skill?.description ?? command?.description}</span>
    </>
  );
}
