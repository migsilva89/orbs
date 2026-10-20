import { botSkillName, mentionTarget } from '@openbots/client/client';
import IconBox from '~icons/lucide/box';
import IconSquareSlash from '~icons/lucide/square-slash';
import type { Command, Skill } from '@openbots/contracts/universal';

interface RoomsMentionOptionProps {
  href: string
  label: string
  skills: Skill[]
  commands: Command[]
}

export function RoomsMentionOption({ href, label, skills, commands }: RoomsMentionOptionProps) {
  const target = mentionTarget({ href });
  const skill = target?.kind === 'skill' ? skills.find((candidate) => candidate.name === target.name) : undefined;
  const command = target?.kind === 'command' ? commands.find((candidate) => candidate.name === target.name) : undefined;

  return (
    <>
      {skill ? <IconBox className="size-5 shrink-0 p-1 text-muted-foreground/60" /> : <IconSquareSlash className="size-5 shrink-0 p-1 text-muted-foreground/60" />}
      <span className="max-w-[45%] shrink-0 truncate font-medium">{skill ? botSkillName({ name: skill.name }) : label}</span>
      <span className="min-w-0 flex-1 truncate text-muted-foreground">{skill?.description ?? command?.description}</span>
    </>
  );
}
