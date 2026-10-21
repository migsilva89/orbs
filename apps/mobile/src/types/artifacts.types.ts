export interface ArtifactsRouteParams extends Record<string, string | string[] | undefined> {
  botId: string;
  artifactId: string;
  conversationId: string;
}
