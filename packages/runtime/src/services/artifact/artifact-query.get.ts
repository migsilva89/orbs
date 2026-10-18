import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { artifactContent, artifactContentKey, artifactDocument } from './artifact.constants';
import { artifactCopy, artifactGet, artifactPointer } from './artifact.utils';
import type { ArtifactGetParams, ArtifactServiceDeps } from '../../types/artifact.types';
import type { Context } from '@earendil-works/chord/context';
import type { Artifact } from '@openbots/contracts/universal';

export async function artifactQueryGet(
  { harness }: ArtifactServiceDeps,
  params: ArtifactGetParams,
  context: Context,
): Promise<Artifact> {
  const record = artifactGet(await harness.snapshot(artifactDocument, params.conversationId, context), params.artifactId);
  const pointer = artifactPointer(record, params.version);
  const content = await harness.snapshot(artifactContent, params.conversationId, artifactContentKey(record.id, pointer.version), context);

  return match(content?.spec)
    .with(P.nullish, () => {
      throw new Errors.NOT_FOUND({ resource: 'artifact', resourceId: record.id });
    })
    .otherwise((spec) => artifactCopy(record, spec, pointer.title, pointer.version));
}
