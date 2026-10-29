import { m } from '@repo/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { BotFormShared } from '@/components/bots/bot-form-shared';
import { rpc } from '@/services/rpc/rpc.client';

interface BotFormSkillsProps {
  botId: string
  busy: boolean
}

export function BotFormSkills({ botId, busy }: BotFormSkillsProps) {
  const shared = useQuery(rpc.skills.shared.queryOptions({ input: { botId } }));

  return (
    <BotFormShared
      busy={busy}
      field="sharedSkills"
      isError={shared.isError}
      items={shared.data?.map((skill) => ({ name: skill.name, detail: skill.description, keywords: `${skill.name} ${skill.description}` }))}
      messages={{
        search: m.bots_skills_search(),
        noMatch: m.bots_skills_no_match(),
        loadFailed: m.bots_skills_load_failed(),
        note: m.bots_skills_note(),
        empty: m.bots_skills_empty(),
      }}
      resource="skills"
    />
  );
}
