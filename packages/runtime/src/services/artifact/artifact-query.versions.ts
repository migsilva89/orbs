import { ARTIFACT } from '@repo/contracts/universal';
import { artifactDocument } from './artifact.constants';
import { artifactGet } from './artifact.utils';
import type { ArtifactContextParams, ArtifactServiceDeps, ArtifactVersionsParams } from '../../types/artifact.types';
import type { ArtifactVersion } from '@repo/contracts/universal';

export async function artifactQueryVersions(
  { harness }: ArtifactServiceDeps,
  { context, ...params }: ArtifactVersionsParams & ArtifactContextParams,
): Promise<ArtifactVersion[]> {
  const record = artifactGet(await harness.snapshot(artifactDocument, params.conversationId, context), params.artifactId);
  return record.versions.slice(0, ARTIFACT.versionsKept).map((item) => ({
    version: item.version,
    createdAt: item.createdAt,
  }));
}
