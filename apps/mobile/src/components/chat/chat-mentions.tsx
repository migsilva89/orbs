import { botSkillName, mentionHref } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { Box, SquareSlash } from 'lucide-react-native';
import { match } from 'ts-pattern';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { PromptDrawer, PromptDrawerItem, PromptDrawerList } from '@/components/ui/prompt-drawer';
import type { RpcSession } from '@/types/rpc.types';
import type { MentionItem, MentionQuery } from '@openbots/client/client';
import type { Bot } from '@openbots/contracts/universal';

interface ChatMentionsProps {
  session: RpcSession;
  bot: Bot;
  bots: Bot[];
  query: MentionQuery;
  onPick: (item: MentionItem) => void;
}

export function ChatMentions({ session, bot, bots, query, onPick }: ChatMentionsProps) {
  const search = query.query.toLowerCase();

  const skills = useQuery({
    ...session.rpc.skills.discover.queryOptions({ input: { botId: bot.id } }),
    enabled: query.char === '$',
  });

  const commands = useQuery({
    ...session.rpc.commands.list.queryOptions({ input: { botId: bot.id } }),
    enabled: query.char === '/',
  });

  const options = match(query.char)
    .with('@', () => bots
      .filter((peer) => peer.id !== bot.id && `${peer.name} ${peer.handle}`.toLowerCase().includes(search))
      .map((peer) => ({
        item: { href: mentionHref({ kind: 'bot', name: peer.id }), label: `@${peer.handle}` },
        title: peer.name,
        description: `@${peer.handle}`,
        leading: (
          <Avatar
            avatar={peer.avatar}
            name={peer.name}
            size="xs"
          />
        ),
      })))
    .with('$', () => (skills.data ?? [])
      .filter((skill) => `${skill.name} ${skill.description}`.toLowerCase().includes(search))
      .map((skill) => ({
        item: { href: mentionHref({ kind: 'skill', name: skill.name }), label: `$${skill.name}` },
        title: botSkillName({ name: skill.name }),
        description: skill.description,
        leading: <Icon icon={Box} />,
      })))
    .otherwise(() => (commands.data ?? [])
      .filter((command) => `${command.name} ${command.description}`.toLowerCase().includes(search))
      .map((command) => ({
        item: { href: mentionHref({ kind: 'command', name: command.name }), label: `/${command.name}` },
        title: `/${command.name}`,
        description: command.description,
        leading: <Icon icon={SquareSlash} />,
      })));

  const empty = match(query.char)
    .with('@', () => m.rooms_mention_bots_empty())
    .with('$', () => match(skills)
      .with({ isPending: true }, () => m.rooms_mention_skills_loading())
      .with({ isError: true }, () => m.rooms_mention_skills_offline())
      .otherwise(() => m.rooms_mention_skills_empty()))
    .otherwise(() => match(commands)
      .with({ isPending: true }, () => m.rooms_mention_commands_loading())
      .with({ isError: true }, () => m.rooms_mention_skills_offline())
      .otherwise(() => m.rooms_mention_commands_empty()));

  return (
    <PromptDrawer>
      {options.length === 0 ? <PromptDrawerItem title={empty} /> : null}
      <PromptDrawerList>
        {options.map((option) => (
          <PromptDrawerItem
            description={option.description}
            key={option.item.href}
            leading={option.leading}
            title={option.title}
            onPress={() => onPick(option.item)}
          />
        ))}
      </PromptDrawerList>
    </PromptDrawer>
  );
}
