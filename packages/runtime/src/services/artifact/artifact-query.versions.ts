import { ARTIFACT } from '@openbots/contracts/universal';
import { artifactDocument } from './artifact.constants';
import { artifactGet } from './artifact.utils';
import type { ArtifactServiceDeps, ArtifactVersionsParams } from '../../types/artifact.types';
import type { Context } from '@earendil-works/chord/context';
import type { ArtifactVersion } from '@openbots/contracts/universal';

export async function artifactQueryVersions(
  { harness }: ArtifactServiceDeps,
  params: ArtifactVersionsParams,
  context: Context,
): Promise<ArtifactVersion[]> {
  const record = artifactGet(await harness.snapshot(artifactDocument, params.conversationId, context), params.artifactId);
  return record.versions.slice(0, ARTIFACT.versionsKept).map((item) => ({
    version: item.version,
    createdAt: item.createdAt,
  }));
}
