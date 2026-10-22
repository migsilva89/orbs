import { getLocale, m } from '@repo/i18n/client';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronRight, LayoutDashboard } from 'lucide-react-native';
import { ScrollView } from 'react-native';
import { match, P } from 'ts-pattern';
import { BotLoadState } from '@/components/bots/bot-load-state';
import { Empty } from '@/components/ui/empty';
import { Icon } from '@/components/ui/icon';
import { ItemButton, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { useConnection } from '@/hooks/use-connection';
import type { RpcSession } from '@/types/rpc.types';

export function ArtifactListScreen() {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => <ArtifactListScreenContent session={current} />)
    .otherwise(() => null);
}

interface ArtifactListScreenContentProps {
  session: RpcSession;
}

function ArtifactListScreenContent({ session }: ArtifactListScreenContentProps) {
  const router = useRouter();
  const bots = useQuery(session.rpc.bots.list.queryOptions());
  const dates = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' });

  const artifacts = useQueries({
    queries: (bots.data ?? []).map((bot) => session.rpc.artifacts.listBot.queryOptions({ input: { botId: bot.id } })),
    combine: (results) => ({
      items: results.flatMap((result) => result.data ?? []).sort((left, right) => right.updatedAt - left.updatedAt),
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
    }),
  });

  if (bots.isPending || bots.isError || artifacts.isPending || artifacts.isError) {
    return (
      <BotLoadState
        isError={bots.isError || artifacts.isError}
        isMissing={false}
        onRetry={() => void Promise.all([
          bots.refetch(),
          session.queryClient.invalidateQueries({ queryKey: session.rpc.artifacts.key() }),
        ])}
      />
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 px-4 pt-4 pb-12"
      contentInsetAdjustmentBehavior="automatic"
    >
      {artifacts.items.length === 0 ? (
        <Empty
          description={m.artifacts_empty_description()}
          icon={(
            <Icon
              icon={LayoutDashboard}
              size="lg"
              tone="muted"
            />
          )}
          title={m.artifacts_empty_title()}
        />
      ) : (
        <ItemGroup>
          {artifacts.items.map((artifact) => (
            <ItemButton
              key={artifact.id}
              onPress={() => router.push({
                pathname: '/bots/[botId]/artifacts/[artifactId]',
                params: { botId: artifact.botId, artifactId: artifact.id, conversationId: artifact.conversationId },
              })}
            >
              <ItemMedia variant="icon">
                <Icon icon={LayoutDashboard} tone="muted" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle numberOfLines={1}>{artifact.title}</ItemTitle>
                <ItemDescription numberOfLines={1}>
                  {m.artifacts_meta({ version: artifact.version, date: dates.format(new Date(artifact.updatedAt)) })}
                </ItemDescription>
              </ItemContent>
              <Icon icon={ChevronRight} tone="muted" />
            </ItemButton>
          ))}
        </ItemGroup>
      )}
    </ScrollView>
  );
}
