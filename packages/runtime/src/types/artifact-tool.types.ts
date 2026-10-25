import { Type } from '@earendil-works/pi-ai';
import { artifactCreate, artifactGet, artifactUpdateFields } from '@repo/contracts/universal';
import { z } from 'zod';
import type { ArtifactService } from '../services/artifact/artifact.service';

export interface ArtifactToolDeps {
  artifacts: ArtifactService;
}

export const artifactToolCreate = artifactCreate.omit({ botId: true, conversationId: true }).strict();
export const artifactToolGet = artifactGet.omit({ botId: true, conversationId: true }).strict();

export const artifactToolUpdate = artifactUpdateFields.omit({ botId: true, conversationId: true }).strict().refine((value) => (
  value.title !== undefined || value.spec !== undefined || value.state !== undefined
));

export const artifactToolCreateParameters = Type.Unsafe<z.infer<typeof artifactToolCreate>>(z.toJSONSchema(artifactToolCreate, { io: 'input' }));
export const artifactToolGetParameters = Type.Unsafe<z.infer<typeof artifactToolGet>>(z.toJSONSchema(artifactToolGet, { io: 'input' }));
export const artifactToolUpdateParameters = Type.Unsafe<z.infer<typeof artifactToolUpdate>>(z.toJSONSchema(artifactToolUpdate, { io: 'input' }));
