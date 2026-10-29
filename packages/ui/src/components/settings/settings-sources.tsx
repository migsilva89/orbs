import { useSettingsSources } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { PanelRow } from '../panel';
import { SettingsGroup } from './settings-group';
import { SettingsPathList } from './settings-path-list';

export function SettingsSources() {
  const sources = useSettingsSources();

  const lists = [
    { key: 'skills', source: sources.skills, title: m.settings_sources_skills(), placeholder: m.settings_sources_skills_placeholder() },
    { key: 'instructions', source: sources.instructions, title: m.settings_sources_instructions(), placeholder: m.settings_sources_instructions_placeholder() },
    { key: 'plugins', source: sources.plugins, title: m.settings_sources_plugins(), placeholder: m.settings_sources_plugins_placeholder() },
    { key: 'mcp', source: sources.mcp, title: m.settings_sources_mcp(), placeholder: m.settings_sources_mcp_placeholder() },
  ];

  return (
    <div className="flex flex-col gap-4">
      {lists.map((list) => (
        <SettingsGroup key={list.key} title={list.title}>
          <PanelRow className="items-start">
            <div className="min-w-0 flex-1">
              <SettingsPathList
                isFailed={list.source.isFailed}
                isPending={list.source.isPending}
                paths={list.source.paths}
                placeholder={list.placeholder}
                title={list.title}
                onChange={list.source.save}
              />
            </div>
          </PanelRow>
        </SettingsGroup>
      ))}
    </div>
  );
}
