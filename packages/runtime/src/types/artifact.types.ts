import type * as PiTypes from '@earendil-works/pi-durable';
import type * as ContractTypes from '@openbots/contracts/universal';

export interface ArtifactServiceDeps {
  harness: PiTypes.Harness;
}

export interface ArtifactConversationParams {
  botId: string;
  conversationId: PiTypes.ConversationId;
}

export type ArtifactListParams = ArtifactConversationParams;
/** `id` is set only when clear-history carries an artifact into a fresh store. */
export type ArtifactCreateParams = ContractTypes.ArtifactCreateInput & ArtifactConversationParams & { id?: string };
export type ArtifactGetParams = ContractTypes.ArtifactGetInput & ArtifactConversationParams;
export type ArtifactUpdateParams = ContractTypes.ArtifactUpdateInput & ArtifactConversationParams;
export type ArtifactSaveStateParams = ContractTypes.ArtifactSaveStateInput & ArtifactConversationParams;
export type ArtifactRestoreParams = ContractTypes.ArtifactRestoreInput & ArtifactConversationParams;
export type ArtifactVersionsParams = ContractTypes.ArtifactVersionsInput & ArtifactConversationParams;

export interface ArtifactVersionPointer extends PiTypes.JsonObject {
  version: number;
  createdAt: number;
  title: string;
}

export interface ArtifactRecord extends PiTypes.JsonObject {
  id: string;
  botId: string;
  conversationId: number;
  title: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  versions: ArtifactVersionPointer[];
}

export interface ArtifactDocument extends PiTypes.JsonObject {
  artifacts: Record<string, ArtifactRecord>;
}

export interface ArtifactVersionData extends PiTypes.JsonObject {
  artifactId: string;
  version: number;
  title: string;
}

export interface ArtifactContent extends PiTypes.JsonObject {
  spec: ContractTypes.ArtifactSpec | null;
}
