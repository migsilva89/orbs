import { artifactsStore } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArtifactView } from '@/components/artifacts/artifact-view';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toasty } from '@/components/ui/sonner';
import { rpc } from '@/services/rpc/rpc.client';
import IconExternalLink from '~icons/lucide/external-link';
import type { ArtifactsRef } from '@/types/artifacts.types';

interface ArtifactDialogProps extends ArtifactsRef {
  title: string
  onOpenChange: (open: boolean) => void
}

export function ArtifactDialog({ botId, conversationId, artifactId, title, onOpenChange }: ArtifactDialogProps) {
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

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(86svh,calc(100svh-10rem))] w-[92vw] max-w-[92vw] flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">{artifact?.title ?? title}</DialogTitle>
          <DialogDescription>{artifact ? m.artifacts_versions({ version: artifact.version }) : null}</DialogDescription>
        </DialogHeader>
        <div className="-mx-6 scrollbar min-h-0 flex-1 overflow-y-auto px-6 [--scrollbar-thumb:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] [--scrollbar-track:transparent] scrollbar-h-1 scrollbar-thumb-rounded-full scrollbar-w-1">
          {artifact ? (
            <ArtifactView
              spec={artifact.spec}
              store={store}
              title={artifact.title}
            />
          ) : null}
          {isPending ? <Skeleton className="h-64 w-full" /> : null}
          {!artifact && !isPending ? <p className="text-sm text-muted-foreground" role="alert">{m.artifacts_error()}</p> : null}
        </div>
        <DialogFooter>
          <Button
            asChild
            size="sm"
            variant="outline"
          >
            <Link params={{ botId, conversationId, artifactId }} to="/artifacts/$botId/$conversationId/$artifactId">
              <IconExternalLink />
              {m.artifacts_open()}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
