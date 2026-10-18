import { artifactDocument } from './artifact.constants';
import { artifactAppendVersion, artifactAssertCurrent, artifactCopy, artifactGet, artifactReadVersion } from './artifact.utils';
import type { ArtifactRestoreParams, ArtifactServiceDeps } from '../../types/artifact.types';
import type { Context } from '@earendil-works/chord/context';
import type { Artifact } from '@openbots/contracts/universal';

export async function artifactActionRestore(
  { harness }: ArtifactServiceDeps,
  params: ArtifactRestoreParams,
  context: Context,
): Promise<Artifact> {
  return harness.commit(async (tx) => {
    const record = artifactGet(await tx.doc(artifactDocument, params.conversationId), params.artifactId);
    artifactAssertCurrent(record, params.version);
    const current = await artifactReadVersion(tx, params.conversationId, record, params.fromVersion);
    record.title = current.title;
    await artifactAppendVersion(tx, params.conversationId, record, current.spec, Date.now());

    return artifactCopy(record, current.spec);
  }, context);
}
