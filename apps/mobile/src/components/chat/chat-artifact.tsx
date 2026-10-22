import { m } from '@openbots/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronRight, LayoutDashboard } from 'lucide-react-native';
import { match, P } from 'ts-pattern';
import { HtmlFrame } from '@/components/ui/html-frame';
import { Icon } from '@/components/ui/icon';
import { ItemButton, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { PreviewCard } from '@/components/ui/preview-card';
import type { RpcSession } from '@/types/rpc.types';
import type { ToolCallArtifact } from '@openbots/contracts/universal';

interface ChatArtifactProps {
  session: RpcSession;
  artifact: ToolCallArtifact;
}

export function ChatArtifact({ session, artifact }: ChatArtifactProps) {
  const router = useRouter();
  const ref = { botId: artifact.botId, conversationId: artifact.conversationId, artifactId: artifact.id };
  const { data: saved } = useQuery(session.rpc.artifacts.get.queryOptions({ input: ref }));
  const title = saved?.title ?? artifact.title;
  const html = match(saved?.spec).with({ html: P.string }, (spec) => spec.html).otherwise(() => undefined);

  const open = () => router.push({
    pathname: '/bots/[botId]/artifacts/[artifactId]',
    params: { botId: artifact.botId, artifactId: artifact.id, conversationId: artifact.conversationId },
  });

  if (html === undefined) {
    return (
      <ItemButton
        accessibilityLabel={m.artifacts_open()}
        variant="bubble"
        onPress={open}
      >
        <ItemMedia>
          <Icon icon={LayoutDashboard} tone="muted" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle numberOfLines={1}>{title}</ItemTitle>
          <ItemDescription>{m.artifacts_kind()}</ItemDescription>
        </ItemContent>
        <Icon icon={ChevronRight} tone="muted" />
      </ItemButton>
    );
  }

  return (
    <PreviewCard
      icon={LayoutDashboard}
      kind={m.ui_html_page()}
      label={m.artifacts_open()}
      title={title}
      onOpen={open}
    >
      <HtmlFrame html={html} title={title} />
    </PreviewCard>
  );
}
