import { artifactsStore } from '@repo/client/client';
import { ARTIFACT } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArtifactView } from '@/components/artifacts/artifact-view';
import { Pane, PaneBody, PaneContent, PaneHeader, PaneTitle } from '@/components/ui/pane';
import { Skeleton } from '@/components/ui/skeleton';
import { toasty } from '@/components/ui/sonner';
import { rpc } from '@/services/rpc/rpc.client';
import type { ArtifactsRef } from '@/types/artifacts.types';

interface ArtifactPaneProps extends ArtifactsRef {
  title: string
  onOpenChange: (open: boolean) => void
}

export function ArtifactPane({ botId, conversationId, artifactId, title, onOpenChange }: ArtifactPaneProps) {
  const queryClient = useQueryClient();
  const { data: artifact, isPending } = useQuery(rpc.artifacts.get.queryOptions({ input: { botId, conversationId, artifactId } }));

  const store = artifactsStore({
    rpc,
    queryClient,
    botId,
    conversationId,
    artifactId,
    onError: () => toasty(m.artifacts_save_error(), '🔴'),
  });

  const rename = useMutation(rpc.artifacts.update.mutationOptions({
    onSuccess: async (saved) => {
      queryClient.setQueryData(rpc.artifacts.get.queryKey({ input: { botId, conversationId, artifactId } }), saved);
      await queryClient.invalidateQueries({ queryKey: rpc.artifacts.key({ input: { botId } }) });
    },
    onError: () => toasty(m.artifacts_rename_error(), '🔴'),
  }));

  return (
    <Pane open onOpenChange={onOpenChange}>
      <PaneContent>
        <PaneHeader>
          <PaneTitle
            icon={artifact?.emoji ?? ARTIFACT.emojiDefault}
            maxLength={ARTIFACT.titleMax}
            renameLabel={m.artifacts_rename()}
            onRename={artifact ? (next) => rename.mutate({
              botId,
              conversationId,
              artifactId,
              version: artifact.version,
              title: next,
            }) : undefined}
          >
            {rename.isPending ? rename.variables.title ?? title : artifact?.title ?? title}
          </PaneTitle>
        </PaneHeader>
        <PaneBody size="wide">
          {artifact ? (
            <ArtifactView
              spec={artifact.spec}
              store={store}
              title={artifact.title}
            />
          ) : null}
          {isPending ? <Skeleton className="h-64 w-full" /> : null}
          {!artifact && !isPending ? <p className="text-sm text-muted-foreground" role="alert">{m.artifacts_error()}</p> : null}
        </PaneBody>
      </PaneContent>
    </Pane>
  );
}
