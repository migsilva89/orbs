import { useSettingsSources } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { FolderTree } from 'lucide-react-native';
import { BotDetailsSection } from '@/components/bots/bot-details-section';
import { SettingsPathList } from './settings-path-list';

export function SettingsSources() {
  const sources = useSettingsSources();

  return (
    <BotDetailsSection
      icon={FolderTree}
      title={m.settings_sources()}
    >
      <SettingsPathList
        isFailed={sources.skills.isFailed}
        isPending={sources.skills.isPending || sources.isLoading}
        paths={sources.skills.paths}
        placeholder={m.settings_sources_skills_placeholder()}
        title={m.settings_sources_skills()}
        onChange={sources.skills.save}
      />
      <SettingsPathList
        isFailed={sources.instructions.isFailed}
        isPending={sources.instructions.isPending || sources.isLoading}
        paths={sources.instructions.paths}
        placeholder={m.settings_sources_instructions_placeholder()}
        title={m.settings_sources_instructions()}
        onChange={sources.instructions.save}
      />
      <SettingsPathList
        isFailed={sources.plugins.isFailed}
        isPending={sources.plugins.isPending || sources.isLoading}
        paths={sources.plugins.paths}
        placeholder={m.settings_sources_plugins_placeholder()}
        title={m.settings_sources_plugins()}
        onChange={sources.plugins.save}
      />
      <SettingsPathList
        isFailed={sources.mcp.isFailed}
        isPending={sources.mcp.isPending || sources.isLoading}
        paths={sources.mcp.paths}
        placeholder={m.settings_sources_mcp_placeholder()}
        title={m.settings_sources_mcp()}
        onChange={sources.mcp.save}
      />
    </BotDetailsSection>
  );
}
