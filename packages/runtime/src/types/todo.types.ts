import type * as PiTypes from '@earendil-works/pi-durable';
import type * as ContractTypes from '@repo/contracts/universal';

export interface TodoServiceDeps {
  harness: PiTypes.Harness;
}

export interface TodoDocument extends PiTypes.JsonObject {
  nextId: number;
  todos: ContractTypes.Todo[];
}

export interface TodoConversationParams {
  conversationId: PiTypes.ConversationId;
}

/** `id` and `isDone` are set only when clear-history carries a todo into a fresh store. */
export type TodoCreateParams = Omit<ContractTypes.TodoCreateInput, 'botId'> & TodoConversationParams & { id?: number; isDone?: boolean };
export type TodoUpdateParams = Omit<ContractTypes.TodoUpdateInput, 'botId'> & TodoConversationParams;
export type TodoReorderParams = Omit<ContractTypes.TodoReorderInput, 'botId'> & TodoConversationParams;
export type TodoTargetParams = Omit<ContractTypes.TodoTarget, 'botId'> & TodoConversationParams;
