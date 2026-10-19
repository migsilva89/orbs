import { m } from '@openbots/i18n/client';
import { getLocale } from '@openbots/i18n/runtime';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Outlet, useHydrated } from '@tanstack/react-router';
import { ArtifactView } from '@/components/artifacts/artifact-view';
import { LayoutPageHeader } from '@/components/layout/layout-page-header';
import { Button } from '@/components/ui/button';
import * as DropdownMenu from '@/components/ui/dropdown-menu';
import { toasty } from '@/components/ui/sonner';
import { artifactsStore } from '@/services/artifacts/artifacts.client';
import { rpc } from '@/services/rpc/rpc.client';
import IconCheck from '~icons/lucide/check';
import IconChevronDown from '~icons/lucide/chevron-down';
import IconHistory from '~icons/lucide/history';

interface ArtifactPageProps {
  botId: string
  conversationId: number
  artifactId: string
}

export function ArtifactPage({ botId, conversationId, artifactId }: ArtifactPageProps) {
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
    queryClient,
    botId,
    conversationId,
    artifactId,
    onError: () => toasty(m.artifacts_save_error(), '🔴'),
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <LayoutPageHeader>
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
      </LayoutPageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 md:px-6">
          <ArtifactView
            key={JSON.stringify(artifact.spec.elements)}
            spec={artifact.spec}
            store={store}
          />
        </div>
      </div>
      <Outlet />
    </div>
  );
}
