import { defineDoc, defineDocFamily, defineEntry } from '@earendil-works/pi-durable';
import { ARTIFACT } from '@repo/contracts/universal';
import type { ArtifactContent, ArtifactDocument, ArtifactVersionData } from '../../types/artifact.types';

export const artifactDocument = defineDoc<ArtifactDocument>({
  kind: ARTIFACT.docKind,
  version: 1,
  scope: 'conversation',
  history: 'latest',
  fork: 'initial',
  initial: () => ({ artifacts: {} }),
});

export const artifactContent = defineDocFamily<ArtifactContent, null>({
  kind: ARTIFACT.contentKind,
  version: 1,
  scope: 'conversation',
  family: true,
  history: 'latest',
  fork: 'initial',
  initial: () => ({ spec: null }),
});

export const artifactVersionEntry = defineEntry<ArtifactVersionData>(ARTIFACT.entryKind);

export function artifactContentKey(artifactId: string, version: number) {
  return `${artifactId}:${version}`;
}
