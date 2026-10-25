import { artifactDocument } from './artifact.constants';
import { artifactAppendVersion, artifactAssertCurrent, artifactCopy, artifactGet, artifactReadVersion } from './artifact.utils';
import type { ArtifactContextParams, ArtifactServiceDeps, ArtifactUpdateParams } from '../../types/artifact.types';
import type { Artifact } from '@repo/contracts/universal';

export async function artifactActionUpdate(
  { harness }: ArtifactServiceDeps,
  { context, ...params }: ArtifactUpdateParams & ArtifactContextParams,
): Promise<Artifact> {
  return harness.commit(async (tx) => {
    const record = artifactGet(await tx.doc(artifactDocument, params.conversationId), params.artifactId);
    artifactAssertCurrent(record, params.version);
    const current = await artifactReadVersion(tx, params.conversationId, record);

    const spec = {
      ...(params.spec ?? current.spec),
      state: params.state ?? params.spec?.state ?? current.spec.state,
    };

    record.title = params.title ?? record.title;
    await artifactAppendVersion(tx, params.conversationId, record, spec, Date.now());

    return artifactCopy(record, spec);
  }, context);
}
