import { artifactsStore } from '@repo/client/client';
import { getLocale, m } from '@repo/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { match, P } from 'ts-pattern';
import { BotLoadState } from '@/components/bots/bot-load-state';
import { Screen } from '@/components/ui/screen';
import { useConnection } from '@/hooks/use-connection';
import { useToast } from '@/hooks/use-toast';
import { ArtifactView } from './artifact-view';
import type { RpcSession } from '@/types/rpc.types';
import type { Artifact } from '@repo/contracts/universal';

interface ArtifactScreenProps {
  botId: string;
  conversationId: number;
  artifactId: string;
}

export function ArtifactScreen(props: ArtifactScreenProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => <ArtifactScreenLoader {...props} session={current} />)
    .otherwise(() => null);
}

interface ArtifactScreenLoaderProps extends ArtifactScreenProps {
  session: RpcSession;
}

function ArtifactScreenLoader({ session, botId, conversationId, artifactId }: ArtifactScreenLoaderProps) {
  const artifact = useQuery(session.rpc.artifacts.get.queryOptions({ input: { botId, conversationId, artifactId } }));

  return match(artifact.data)
    .with(P.nonNullable, (ready) => <ArtifactScreenView artifact={ready} session={session} />)
    .otherwise(() => (
      <BotLoadState
        isError={artifact.isError}
        isMissing={false}
        onRetry={() => void artifact.refetch()}
      />
    ));
}

interface ArtifactScreenViewProps {
  session: RpcSession;
  artifact: Artifact;
}

function ArtifactScreenView({ session, artifact }: ArtifactScreenViewProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const dates = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' });
  const { botId, conversationId, id: artifactId } = artifact;
  const versions = useQuery(session.rpc.artifacts.versions.queryOptions({ input: { botId, conversationId, artifactId } }));

  const restore = useMutation(session.rpc.artifacts.restore.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: session.rpc.artifacts.key({ input: { botId } }) });
      toast.show({ message: m.artifacts_restored() });
    },
    onError: () => toast.show({ message: m.artifacts_restore_error() }),
  }));

  const store = artifactsStore({
    rpc: session.rpc,
    queryClient,
    botId,
    conversationId,
    artifactId,
    onError: () => toast.show({ message: m.artifacts_save_error() }),
  });

  return (
    <Screen padding="none" scroll={false}>
      <Stack.Screen options={{ title: artifact.title }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu
          accessibilityLabel={m.artifacts_versions({ version: artifact.version })}
          disabled={restore.isPending}
          icon="clock.arrow.circlepath"
          title={m.artifacts_versions({ version: artifact.version })}
        >
          {(versions.data ?? []).map((version) => (
            <Stack.Toolbar.MenuAction
              disabled={version.version === artifact.version}
              icon={version.version === artifact.version ? 'checkmark' : 'clock.arrow.circlepath'}
              key={version.version}
              onPress={() => restore.mutate({
                botId,
                conversationId,
                artifactId,
                version: artifact.version,
                fromVersion: version.version,
              })}
            >
              {m.artifacts_version_item({ version: version.version, date: dates.format(new Date(version.createdAt)) })}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <ArtifactView
        spec={artifact.spec}
        store={store}
        title={artifact.title}
      />
    </Screen>
  );
}
