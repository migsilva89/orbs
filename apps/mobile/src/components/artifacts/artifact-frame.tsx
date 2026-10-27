import { artifactEmbedMessage, SERVER_PROTOCOL } from '@repo/contracts/universal';
import { Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { useUniwind } from 'uniwind';
import type { RpcSession } from '@/types/rpc.types';
import type { StateStore } from '@json-render/core';
import type { Artifact } from '@repo/contracts/universal';
import type { WebViewMessageEvent } from 'react-native-webview';

interface ArtifactFrameProps {
  session: RpcSession;
  artifact: Artifact;
  store: StateStore;
}

export function ArtifactFrame({ session, artifact, store }: ArtifactFrameProps) {
  const { theme } = useUniwind();
  const path = `/embed/artifacts/${artifact.botId}/${String(artifact.conversationId)}/${artifact.id}`;
  const uri = new URL(`${path}?theme=${theme === 'dark' ? 'dark' : 'light'}`, session.address().url).toString();

  function handleMessage(event: WebViewMessageEvent) {
    const message = artifactEmbedMessage.safeParse(JSON.parse(event.nativeEvent.data));

    if (message.success) {
      store.update(Object.fromEntries(Object.entries(message.data.state).map(([key, value]) => [`/${key}`, value])));
    }
  }

  return (
    <WebView
      accessibilityLabel={artifact.title}
      contentInsetAdjustmentBehavior="automatic"
      originWhitelist={[new URL(uri).origin]}
      source={{
        uri,
        headers: {
          authorization: `Bearer ${session.connection.token}`,
          [SERVER_PROTOCOL.versionHeader]: String(SERVER_PROTOCOL.version),
          [SERVER_PROTOCOL.serverIdHeader]: session.connection.serverId,
        },
      }}
      style={{ flex: 1, backgroundColor: 'transparent' }}
      onMessage={handleMessage}
      onShouldStartLoadWithRequest={(request) => {
        if (new URL(request.url).pathname === path) {
          return true;
        }

        void Linking.openURL(request.url);

        return false;
      }}
    />
  );
}
