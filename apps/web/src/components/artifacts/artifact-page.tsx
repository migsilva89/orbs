import { artifactsStore } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { getLocale } from '@repo/i18n/runtime';
import { ArtifactView } from '@repo/ui/artifact-view';
import { Button } from '@repo/ui/button';
import * as DropdownMenu from '@repo/ui/dropdown-menu';
import { SectionDialogBody } from '@repo/ui/section-dialog';
import { toasty } from '@repo/ui/sonner';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useHydrated } from '@tanstack/react-router';
import { rpc } from '@/services/rpc/rpc.client';
import IconCheck from '~icons/lucide/check';
import IconChevronDown from '~icons/lucide/chevron-down';
import IconHistory from '~icons/lucide/history';
import IconMaximize from '~icons/lucide/maximize-2';
import IconMinimize from '~icons/lucide/minimize-2';
import type { ArtifactsRef } from '@repo/ui/artifacts.types';

interface ArtifactPageProps extends ArtifactsRef {
  isExpanded: boolean
  onExpandedChange: (isExpanded: boolean) => void
}

export function ArtifactPage({ botId, conversationId, artifactId, isExpanded, onExpandedChange }: ArtifactPageProps) {
  const queryClient = useQueryClient();
  const hydrated = useHydrated();
  const dates = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' });
  const { data: artifact } = useSuspenseQuery(rpc.artifacts.get.queryOptions({ input: { botId, conversationId, artifactId } }));
  const { data: versions = [] } = useQuery(rpc.artifacts.versions.queryOptions({ input: { botId, conversationId, artifactId } }));

  const restore = useMutation(rpc.artifacts.restore.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rpc.artifacts.key({ input: { botId } }) });
      toasty(m.artifacts_restored(), '✅');
    },
    onError: () => toasty(m.artifacts_restore_error(), '🔴'),
  }));

  const store = artifactsStore({
    rpc,
    queryClient,
    botId,
    conversationId,
    artifactId,
    onError: () => toasty(m.artifacts_save_error(), '🔴'),
  });

  return (
    <SectionDialogBody
      actions={(
        <div className="flex items-center gap-1 @max-[720px]/section-dialog:-ml-3">
          <DropdownMenu.DropdownMenu>
            <DropdownMenu.DropdownMenuTrigger asChild>
              <Button
                disabled={restore.isPending}
                size="sm"
                variant="ghost"
              >
                <IconHistory />
                {m.artifacts_versions({ version: artifact.version })}
                <IconChevronDown />
              </Button>
            </DropdownMenu.DropdownMenuTrigger>
            <DropdownMenu.DropdownMenuContent align="end">
              {versions.map((version) => (
                <DropdownMenu.DropdownMenuItem
                  disabled={version.version === artifact.version}
                  key={version.version}
                  onSelect={() => restore.mutate({
                    botId,
                    conversationId,
                    artifactId,
                    version: artifact.version,
                    fromVersion: version.version,
                  })}
                >
                  {version.version === artifact.version ? <IconCheck className="size-4" /> : <IconHistory className="size-4" />}
                  <span className="flex-1">
                    {m.artifacts_version_item({
                      version: version.version,
                      date: hydrated ? dates.format(new Date(version.createdAt)) : '',
                    })}
                  </span>
                </DropdownMenu.DropdownMenuItem>
              ))}
            </DropdownMenu.DropdownMenuContent>
          </DropdownMenu.DropdownMenu>
          <Button
            aria-label={isExpanded ? m.artifacts_exit_full_screen() : m.artifacts_full_screen()}
            size="icon-sm"
            title={isExpanded ? m.artifacts_exit_full_screen() : m.artifacts_full_screen()}
            type="button"
            variant="ghost"
            onClick={() => onExpandedChange(!isExpanded)}
          >
            {isExpanded ? <IconMinimize className="opacity-70" /> : <IconMaximize className="opacity-70" />}
          </Button>
        </div>
      )}
      description={m.artifacts_meta({ version: artifact.version, date: hydrated ? dates.format(new Date(artifact.updatedAt)) : '' })}
      key={artifactId}
      title={artifact.title}
    >
      <ArtifactView
        spec={artifact.spec}
        store={store}
        title={artifact.title}
      />
    </SectionDialogBody>
  );
}
