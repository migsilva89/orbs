import { m } from '@openbots/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard } from 'lucide-react-native';
import { match, P } from 'ts-pattern';
import { HtmlFrame } from '@/components/ui/html-frame';
import { PreviewCard } from '@/components/ui/preview-card';
import type { RpcSession } from '@/types/rpc.types';
import type { ToolCallArtifact } from '@openbots/contracts/universal';

interface ChatArtifactProps {
  session: RpcSession;
  artifact: ToolCallArtifact;
}

export function ChatArtifact({ session, artifact }: ChatArtifactProps) {
  const ref = { botId: artifact.botId, conversationId: artifact.conversationId, artifactId: artifact.id };
  const { data: saved } = useQuery(session.rpc.artifacts.get.queryOptions({ input: ref }));
  const title = saved?.title ?? artifact.title;
  const html = match(saved?.spec).with({ html: P.string }, (spec) => spec.html).otherwise(() => undefined);

  return (
    <PreviewCard
      description={m.artifacts_chat_card({ version: saved?.version ?? artifact.version })}
      expanded={html === undefined ? null : (
        <HtmlFrame
          fill
          html={html}
          title={title}
        />
      )}
      icon={LayoutDashboard}
      title={title}
    >
      {html === undefined ? null : <HtmlFrame html={html} title={title} />}
    </PreviewCard>
  );
}
