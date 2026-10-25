import type { Context } from '@earendil-works/chord/context';
import type * as PiTypes from '@earendil-works/pi-durable';
import type * as ContractTypes from '@repo/contracts/universal';

export interface TodoServiceDeps {
  harness: PiTypes.Harness;
}

export interface TodoContextParams {
  context: Context;
}

export interface TodoDocument extends PiTypes.JsonObject {
  nextId: number;
  todos: ContractTypes.Todo[];
}

export interface TodoConversationParams {
  conversationId: PiTypes.ConversationId;
}

export type TodoCreateParams = Omit<ContractTypes.TodoCreateInput, 'botId'> & TodoConversationParams & { id?: number; isDone?: boolean };
export type TodoUpdateParams = Omit<ContractTypes.TodoUpdateInput, 'botId'> & TodoConversationParams;
export type TodoReorderParams = Omit<ContractTypes.TodoReorderInput, 'botId'> & TodoConversationParams;
export type TodoTargetParams = Omit<ContractTypes.TodoTarget, 'botId'> & TodoConversationParams;
