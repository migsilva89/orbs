import { artifactsStore } from '@repo/client/client';
import { ARTIFACT } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { match, P } from 'ts-pattern';
import { ArtifactPane } from '@/components/artifacts/artifact-pane';
import { ArtifactView } from '@/components/artifacts/artifact-view';
import { PreviewCard } from '@/components/ui/preview-card';
import { toasty } from '@/components/ui/sonner';
import { rpc } from '@/services/rpc/rpc.client';
import type { ToolCallArtifact } from '@repo/contracts/universal';

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
    <>
      <PreviewCard
        icon={saved?.emoji ?? ARTIFACT.emojiDefault}
        kind={match(saved?.spec).with({ html: P.string }, () => m.ui_html_page()).otherwise(() => m.artifacts_kind())}
        label={m.artifacts_expand()}
        title={saved?.title ?? artifact.title}
        onOpen={() => setExpanded(true)}
      >
        {saved ? (
          <ArtifactView
            spec={saved.spec}
            store={store}
            title={saved.title}
          />
        ) : null}
      </PreviewCard>
      {expanded ? (
        <ArtifactPane
          artifactId={artifact.id}
          botId={artifact.botId}
          conversationId={artifact.conversationId}
          title={saved?.title ?? artifact.title}
          onOpenChange={setExpanded}
        />
      ) : null}
    </>
  );
}
