import { botSkillName, mentionTarget } from '@openbots/client/client';
import { Mention } from '@/components/ui/mention';
import IconBox from '~icons/lucide/box';
import IconSquareSlash from '~icons/lucide/square-slash';

interface RoomsMentionProps {
  href: string
  label: string
}

export function RoomsMention({ href, label }: RoomsMentionProps) {
  const target = mentionTarget({ href });

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
      <Mention title={label} variant="outline-soft">
        <IconSquareSlash className="size-4 p-0.5" />
        {target.name}
      </Mention>
    );
  }

  return <Mention variant="muted">{label}</Mention>;
}
