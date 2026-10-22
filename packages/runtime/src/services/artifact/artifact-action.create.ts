import { match, P } from 'ts-pattern';
import { artifactDocument } from './artifact.constants';
import { artifactAppendVersion, artifactCopy, artifactReadVersion } from './artifact.utils';
import type { ArtifactCreateParams, ArtifactRecord, ArtifactServiceDeps } from '../../types/artifact.types';
import type { Context } from '@earendil-works/chord/context';
import type { Artifact } from '@repo/contracts/universal';

export async function artifactActionCreate(
  { harness }: ArtifactServiceDeps,
  params: ArtifactCreateParams,
  context: Context,
): Promise<Artifact> {
  const now = Date.now();
  const id = params.id ?? crypto.randomUUID();

  return harness.commit(async (tx) => {
    const doc = await tx.doc(artifactDocument, params.conversationId);

    return match(doc.artifacts[id])
      .with(P.nonNullable, async (existing) => {
        const { spec } = await artifactReadVersion(tx, params.conversationId, existing);
        return artifactCopy(existing, spec);
      })
      .otherwise(async () => {
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
      });
  }, context);
}
