import { useSettingsSources } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { SettingsPathList } from '@/components/settings/settings-path-list';
import { PanelRow } from '@/components/ui/panel';
import IconBox from '~icons/lucide/box';
import IconFileText from '~icons/lucide/file-text';
import IconFolderTree from '~icons/lucide/folder-tree';
import IconPlug from '~icons/lucide/plug';
import IconPuzzle from '~icons/lucide/puzzle';

export function SettingsSources() {
  const sources = useSettingsSources();

  return (
    <SettingsPanel
      description={m.settings_sources_hint()}
      icon={IconFolderTree}
      id="sources"
      title={m.settings_sources()}
    >
      <PanelRow className="items-start">
        <IconBox />
        <div className="min-w-0 flex-1">
          <SettingsPathList
            hint={m.settings_sources_skills_hint()}
            isFailed={sources.skills.isFailed}
            isPending={sources.skills.isPending}
            paths={sources.skills.paths}
            placeholder={m.settings_sources_skills_placeholder()}
            title={m.settings_sources_skills()}
            onChange={sources.skills.save}
          />
        </div>
      </PanelRow>
      <PanelRow className="items-start">
        <IconFileText />
        <div className="min-w-0 flex-1">
          <SettingsPathList
            hint={m.settings_sources_instructions_hint()}
            isFailed={sources.instructions.isFailed}
            isPending={sources.instructions.isPending}
            paths={sources.instructions.paths}
            placeholder={m.settings_sources_instructions_placeholder()}
            title={m.settings_sources_instructions()}
            onChange={sources.instructions.save}
          />
        </div>
      </PanelRow>
      <PanelRow className="items-start">
        <IconPuzzle />
        <div className="min-w-0 flex-1">
          <SettingsPathList
            hint={m.settings_sources_plugins_hint()}
            isFailed={sources.plugins.isFailed}
            isPending={sources.plugins.isPending}
            paths={sources.plugins.paths}
            placeholder={m.settings_sources_plugins_placeholder()}
            title={m.settings_sources_plugins()}
            onChange={sources.plugins.save}
          />
        </div>
      </PanelRow>
      <PanelRow className="items-start">
        <IconPlug />
        <div className="min-w-0 flex-1">
          <SettingsPathList
            hint={m.settings_sources_mcp_hint()}
            isFailed={sources.mcp.isFailed}
            isPending={sources.mcp.isPending}
            paths={sources.mcp.paths}
            placeholder={m.settings_sources_mcp_placeholder()}
            title={m.settings_sources_mcp()}
            onChange={sources.mcp.save}
          />
        </div>
      </PanelRow>
    </SettingsPanel>
  );
}
