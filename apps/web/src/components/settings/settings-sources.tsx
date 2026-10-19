import { m } from '@openbots/i18n/client';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { SettingsPathList } from '@/components/settings/settings-path-list';
import { PanelRow } from '@/components/ui/panel';
import { rpc } from '@/services/rpc/rpc.client';
import IconBox from '~icons/lucide/box';
import IconFileText from '~icons/lucide/file-text';
import IconFolderTree from '~icons/lucide/folder-tree';
import IconPlug from '~icons/lucide/plug';
import IconPuzzle from '~icons/lucide/puzzle';

export function SettingsSources() {
  const queryClient = useQueryClient();
  const { data: skills } = useSuspenseQuery(rpc.skills.settings.queryOptions());
  const { data: instructions } = useSuspenseQuery(rpc.instructions.settings.queryOptions());
  const { data: plugins } = useSuspenseQuery(rpc.plugins.settings.queryOptions());
  const { data: mcp } = useSuspenseQuery(rpc.mcp.settings.queryOptions());

  const saveSkills = useMutation(rpc.skills.configure.mutationOptions({
    onSuccess: (saved) => queryClient.setQueryData(rpc.skills.settings.queryKey(), saved),
  }));

  const saveInstructions = useMutation(rpc.instructions.configure.mutationOptions({
    onSuccess: (saved) => queryClient.setQueryData(rpc.instructions.settings.queryKey(), saved),
  }));

  const savePlugins = useMutation(rpc.plugins.configure.mutationOptions({
    onSuccess: (saved) => queryClient.setQueryData(rpc.plugins.settings.queryKey(), saved),
  }));

  const saveMcp = useMutation(rpc.mcp.configure.mutationOptions({
    onSuccess: (saved) => queryClient.setQueryData(rpc.mcp.settings.queryKey(), saved),
  }));

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
            isFailed={saveSkills.isError}
            isPending={saveSkills.isPending}
            paths={skills.directories}
            placeholder={m.settings_sources_skills_placeholder()}
            title={m.settings_sources_skills()}
            onChange={(directories) => saveSkills.mutate({ directories })}
          />
        </div>
      </PanelRow>
      <PanelRow className="items-start">
        <IconFileText />
        <div className="min-w-0 flex-1">
          <SettingsPathList
            hint={m.settings_sources_instructions_hint()}
            isFailed={saveInstructions.isError}
            isPending={saveInstructions.isPending}
            paths={instructions.paths}
            placeholder={m.settings_sources_instructions_placeholder()}
            title={m.settings_sources_instructions()}
            onChange={(paths) => saveInstructions.mutate({ paths })}
          />
        </div>
      </PanelRow>
      <PanelRow className="items-start">
        <IconPuzzle />
        <div className="min-w-0 flex-1">
          <SettingsPathList
            hint={m.settings_sources_plugins_hint()}
            isFailed={savePlugins.isError}
            isPending={savePlugins.isPending}
            paths={plugins.directories}
            placeholder={m.settings_sources_plugins_placeholder()}
            title={m.settings_sources_plugins()}
            onChange={(directories) => savePlugins.mutate({ directories })}
          />
        </div>
      </PanelRow>
      <PanelRow className="items-start">
        <IconPlug />
        <div className="min-w-0 flex-1">
          <SettingsPathList
            hint={m.settings_sources_mcp_hint()}
            isFailed={saveMcp.isError}
            isPending={saveMcp.isPending}
            paths={mcp.paths}
            placeholder={m.settings_sources_mcp_placeholder()}
            title={m.settings_sources_mcp()}
            onChange={(paths) => saveMcp.mutate({ paths })}
          />
        </div>
      </PanelRow>
    </SettingsPanel>
  );
}
