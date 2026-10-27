import { createStateStore } from '@json-render/core';
import { artifact } from '@repo/contracts/universal';
import { hydrateRoot } from 'react-dom/client';
import { ArtifactEmbed } from '../components/artifacts/artifact-embed';

const root = document.getElementById('artifact');
const payload = artifact.pick({ title: true, spec: true }).safeParse(JSON.parse(document.getElementById('artifact-payload')?.textContent ?? 'null'));

if (root && payload.success) {
  const store = createStateStore(payload.data.spec.state);

  store.subscribe(() => {
    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'bots.artifact-state', state: store.getSnapshot() }));
  });

  hydrateRoot(root, (
    <ArtifactEmbed
      spec={payload.data.spec}
      store={store}
      title={payload.data.title}
    />
  ));
}
