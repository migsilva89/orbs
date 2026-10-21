import { useLocalSearchParams } from 'expo-router';
import { ArtifactScreen } from '@/components/artifacts/artifact-screen';
import type { ArtifactsRouteParams } from '@/types/artifacts.types';

export default function ArtifactRoute() {
  const { botId, artifactId, conversationId } = useLocalSearchParams<ArtifactsRouteParams>();

  return (
    <ArtifactScreen
      artifactId={artifactId}
      botId={botId}
      conversationId={Number(conversationId)}
    />
  );
}
