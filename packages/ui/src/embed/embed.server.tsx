import { createStateStore } from '@json-render/core';
import { renderToString } from 'react-dom/server';
import { ArtifactEmbed } from '../components/artifacts/artifact-embed';
import type { EmbedPageParams } from '../types/embed.types';

export function embedRender({ artifact }: Pick<EmbedPageParams, 'artifact'>): string {
  return renderToString(
    <ArtifactEmbed
      spec={artifact.spec}
      store={createStateStore(artifact.spec.state)}
      title={artifact.title}
    />,
  );
}
