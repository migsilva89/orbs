import { artifactDocument } from './artifact.constants';
import { artifactAppendVersion, artifactCopy } from './artifact.utils';
import type { ArtifactCreateParams, ArtifactRecord, ArtifactServiceDeps } from '../../types/artifact.types';
import type { Context } from '@earendil-works/chord/context';
import type { Artifact } from '@openbots/contracts/universal';

export async function artifactActionCreate(
  { harness }: ArtifactServiceDeps,
  params: ArtifactCreateParams,
  context: Context,
): Promise<Artifact> {
  const now = Date.now();
  const id = crypto.randomUUID();

  return harness.commit(async (tx) => {
    const doc = await tx.doc(artifactDocument, params.conversationId);

    const record: ArtifactRecord = {
      id,
      botId: params.botId,
      conversationId: params.conversationId,
      title: params.title,
      version: 0,
      createdAt: now,
      updatedAt: now,
      versions: [],
    };

    await artifactAppendVersion(tx, params.conversationId, record, params.spec, now);
    doc.artifacts[id] = record;

    return artifactCopy(record, params.spec);
  }, context);
}
