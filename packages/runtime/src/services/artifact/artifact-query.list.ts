import { ARTIFACT } from '@repo/contracts/universal';
import { artifactDocument } from './artifact.constants';
import { artifactSummary } from './artifact.utils';
import type { ArtifactListParams, ArtifactServiceDeps } from '../../types/artifact.types';
import type { Context } from '@earendil-works/chord/context';
import type { ArtifactSummary } from '@repo/contracts/universal';

export async function artifactQueryList(
  { harness }: ArtifactServiceDeps,
  params: ArtifactListParams,
  context: Context,
): Promise<ArtifactSummary[]> {
  const doc = await harness.snapshot(artifactDocument, params.conversationId, context);
  return Object.values(doc?.artifacts ?? {})
    .map(artifactSummary)
    .sort((left, right) => right.updatedAt - left.updatedAt || left.id.localeCompare(right.id))
    .slice(0, ARTIFACT.listLimit);
}
