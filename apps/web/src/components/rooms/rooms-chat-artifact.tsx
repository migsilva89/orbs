import { artifactsStore } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { match, P } from 'ts-pattern';
import { ArtifactDialog } from '@/components/artifacts/artifact-dialog';
import { ArtifactView } from '@/components/artifacts/artifact-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toasty } from '@/components/ui/sonner';
import { rpc } from '@/services/rpc/rpc.client';
import IconExternalLink from '~icons/lucide/external-link';
import IconLayoutDashboard from '~icons/lucide/layout-dashboard';
import IconMaximize from '~icons/lucide/maximize-2';
import type { ToolCallArtifact } from '@openbots/contracts/universal';

interface RoomsChatArtifactProps {
  artifact: ToolCallArtifact
}

export function RoomsChatArtifact({ artifact }: RoomsChatArtifactProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const ref = { botId: artifact.botId, conversationId: artifact.conversationId, artifactId: artifact.id };
  const { data: saved } = useQuery(rpc.artifacts.get.queryOptions({ input: ref }));

  const store = artifactsStore({
    rpc,
    queryClient,
    botId: artifact.botId,
    conversationId: artifact.conversationId,
    artifactId: artifact.id,
    onError: () => toasty(m.artifacts_save_error(), '🔴'),
  });

  return (
    <Card data-message-wide className="w-full self-start overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <IconLayoutDashboard className="size-4 shrink-0 text-muted-foreground" />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-sm font-medium">{saved?.title ?? artifact.title}</span>
          <span className="text-xs text-muted-foreground">{m.artifacts_chat_card({ version: saved?.version ?? artifact.version })}</span>
        </div>
        <Button
          aria-label={m.artifacts_expand()}
          size="icon-xs"
          title={m.artifacts_expand()}
          variant="ghost"
          onClick={() => setExpanded(true)}
        >
          <IconMaximize />
        </Button>
        <Button
          asChild
          size="icon-xs"
          variant="ghost"
        >
          <Link
            aria-label={m.artifacts_open()}
            params={{ botId: artifact.botId, conversationId: artifact.conversationId, artifactId: artifact.id }}
            title={m.artifacts_open()}
            to="/artifacts/$botId/$conversationId/$artifactId"
          >
            <IconExternalLink />
          </Link>
        </Button>
      </div>
      {saved ? (
        <>
          <Separator />
          {match(saved.spec)
            .with({ html: P.string }, (spec) => (
              <ArtifactView
                spec={spec}
                store={store}
                title={saved.title}
              />
            ))
            .otherwise((spec) => (
              <button
                aria-label={m.artifacts_expand()}
                className="relative block max-h-80 w-full cursor-zoom-in overflow-hidden p-4 text-left"
                type="button"
                onClick={() => setExpanded(true)}
              >
                <div inert className="pointer-events-none">
                  <ArtifactView
                    spec={spec}
                    store={store}
                    title={saved.title}
                  />
                </div>
              </button>
            ))}
        </>
      ) : null}
      {expanded ? (
        <ArtifactDialog
          artifactId={artifact.id}
          botId={artifact.botId}
          conversationId={artifact.conversationId}
          title={saved?.title ?? artifact.title}
          onOpenChange={setExpanded}
        />
      ) : null}
    </Card>
  );
}
