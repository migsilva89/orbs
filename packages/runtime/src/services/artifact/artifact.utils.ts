import { resolveElementProps, validateSpec } from '@json-render/core';
import { ARTIFACT, artifactComponents, artifactSpec } from '@openbots/contracts/universal';
import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { artifactContent, artifactContentKey, artifactVersionEntry } from './artifact.constants';
import type { ArtifactDocument, ArtifactRecord, ArtifactVersionPointer } from '../../types/artifact.types';
import type { ConversationId, Tx } from '@earendil-works/pi-durable';
import type { Artifact, ArtifactSpec, ArtifactSummary } from '@openbots/contracts/universal';

export function artifactGet(doc: ArtifactDocument | null | undefined, artifactId: string): ArtifactRecord {
  return match(doc?.artifacts[artifactId])
    .with(P.nonNullable, (artifact) => artifact)
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'artifact', resourceId: artifactId });
    });
}

export function artifactSummary(record: ArtifactRecord): ArtifactSummary {
  return {
    id: record.id,
    botId: record.botId,
    conversationId: record.conversationId,
    title: record.title,
    version: record.version,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function artifactCopy(record: ArtifactRecord, spec: ArtifactSpec, title = record.title, version = record.version): Artifact {
  return {
    ...artifactSummary(record),
    title,
    version,
    spec: artifactSpec.parse(spec),
  };
}

export function artifactAssertCurrent(record: ArtifactRecord, version: number) {
  match(record.version === version)
    .with(true, () => undefined)
    .with(false, () => {
      throw new Errors.CONFLICT();
    })
    .exhaustive();
}

function artifactAssertSpec(spec: ArtifactSpec) {
  match(artifactSpecIssues(spec))
    .with([], () => undefined)
    .otherwise(() => {
      throw new Errors.VALIDATION_ERROR({ fields: { spec: { message: 'validation_artifact_spec' } } });
    });
}

export function artifactPointer(record: ArtifactRecord, version = record.version): ArtifactVersionPointer {
  return match(record.versions.find((item) => item.version === version))
    .with(P.nonNullable, (value) => value)
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'artifact', resourceId: record.id });
    });
}

export async function artifactReadVersion(tx: Tx, conversationId: ConversationId, record: ArtifactRecord, version?: number) {
  const pointer = artifactPointer(record, version);
  const content = await tx.doc(artifactContent, conversationId, artifactContentKey(record.id, pointer.version), null);

  return match(content.spec)
    .with(P.nullish, () => {
      throw new Errors.NOT_FOUND({ resource: 'artifact', resourceId: record.id });
    })
    .otherwise((spec) => ({
      title: pointer.title,
      version: pointer.version,
      spec,
    }));
}

export async function artifactAppendVersion(
  tx: Tx,
  conversationId: ConversationId,
  record: ArtifactRecord,
  spec: ArtifactSpec,
  now: number,
) {
  artifactAssertSpec(spec);
  const version = record.version + 1;
  const content = await tx.doc(artifactContent, conversationId, artifactContentKey(record.id, version), null);
  content.spec = spec;

  await tx.appendEntry(artifactVersionEntry, conversationId, {
    data: {
      artifactId: record.id,
      version,
      title: record.title,
    },
  });

  record.version = version;
  record.updatedAt = now;
  record.versions = [{ version, createdAt: now, title: record.title }, ...record.versions].slice(0, ARTIFACT.versionsKept);
}

function artifactSpecIssues(spec: ArtifactSpec): string[] {
  const bytes = new TextEncoder().encode(JSON.stringify(spec)).length;

  return match(spec)
    .with({ html: P.string }, () => bytes <= ARTIFACT.specBytesMax ? [] : ['spec'])
    .otherwise((structured) => artifactStructuredSpecIssues(structured, bytes));
}

function artifactStructuredSpecIssues(spec: Extract<ArtifactSpec, { root: string }>, bytes: number): string[] {
  return match(bytes <= ARTIFACT.specBytesMax && artifactHasTree(spec))
    .with(false, () => ['spec'])
    .with(true, () => [
      ...validateSpec(spec).issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message),
      ...Object.entries(spec.elements).flatMap(([key, element]) => {
        const component = Object.entries(artifactComponents).find(([name]) => name === element.type)?.[1];

        return match(component)
          .with(P.nullish, () => [key])
          .otherwise((value) => {
            const parsed = value.props.safeParse(resolveElementProps(element.props, { stateModel: spec.state }));
            return match(parsed.success)
              .with(true, () => [])
              .with(false, () => [key])
              .exhaustive();
          });
      }),
    ])
    .exhaustive();
}

// json-render validates references and props, but does not reject child cycles.
function artifactHasTree(spec: Extract<ArtifactSpec, { root: string }>): boolean {
  const seen = new Set<string>();
  const pending = [{ id: spec.root, depth: 1 }];
  let isValid = true;

  while (pending.length > 0 && isValid) {
    isValid = match(pending.pop())
      .with(P.nonNullable, ({ id, depth }) => (
        match(depth <= ARTIFACT.depthMax && !seen.has(id) && Object.hasOwn(spec.elements, id))
          .with(true, () => {
            seen.add(id);
            for (const child of spec.elements[id].children) {
              pending.push({ id: child, depth: depth + 1 });
            }

            return true;
          })
          .with(false, () => false)
          .exhaustive()
      ))
      .otherwise(() => false);
  }

  return isValid && seen.size === Object.keys(spec.elements).length;
}
