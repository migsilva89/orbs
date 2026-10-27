import { artifactsStore } from '@repo/client/client';
import { ARTIFACT } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { match, P } from 'ts-pattern';
import { ArtifactView } from '@/components/artifacts/artifact-view';
import { HtmlFrame } from '@/components/ui/html-frame';
import { PreviewCard } from '@/components/ui/preview-card';
import { useToast } from '@/hooks/use-toast';
import type { RpcSession } from '@/types/rpc.types';
import type { ToolCallArtifact } from '@repo/contracts/universal';

interface ChatArtifactProps {
  session: RpcSession;
  artifact: ToolCallArtifact;
}

export function ChatArtifact({ session, artifact }: ChatArtifactProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const ref = { botId: artifact.botId, conversationId: artifact.conversationId, artifactId: artifact.id };
  const { data: saved } = useQuery(session.rpc.artifacts.get.queryOptions({ input: ref }));
  const title = saved?.title ?? artifact.title;
  const html = match(saved?.spec).with({ html: P.string }, (spec) => spec.html).otherwise(() => undefined);

  const store = artifactsStore({
    rpc: session.rpc,
    queryClient,
    ...ref,
    onError: () => toast.show({ message: m.artifacts_save_error() }),
  });

  const open = () => router.push({
    pathname: '/bots/[botId]/artifacts/[artifactId]',
    params: { botId: artifact.botId, artifactId: artifact.id, conversationId: artifact.conversationId },
  });

  return (
    <PreviewCard
      content={html === undefined ? 'padded' : 'page'}
      emoji={saved?.emoji ?? ARTIFACT.emojiDefault}
      kind={html === undefined ? m.artifacts_kind() : m.ui_html_page()}
      label={m.artifacts_open()}
      title={title}
      onOpen={open}
    >
      {match(saved)
        .with(undefined, () => null)
        .otherwise((current) => (html === undefined ? (
          <ArtifactView
            isPreview
            spec={current.spec}
            store={store}
            title={title}
          />
        ) : <HtmlFrame html={html} title={title} />))}
    </PreviewCard>
  );
}
