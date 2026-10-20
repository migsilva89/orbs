import type { BotDetailsRouteParams } from '@/types/bot-details.types';
import type * as ChatTypes from '@/types/chat.types';
import type * as TodosTypes from '@/types/todos.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export interface NavigationParams extends Record<string, object | undefined> {
  Bots: undefined;
  Chat: ChatTypes.ChatRouteParams;
  MessageActions: ChatTypes.ChatActionsRouteParams;
  ReactionPicker: ChatTypes.ChatReactionParams;
  MessageText: ChatTypes.ChatTextRouteParams;
  BotDetails: BotDetailsRouteParams;
  ChatReset: BotDetailsRouteParams;
  BotDelete: BotDetailsRouteParams;
  TodosDelete: TodosTypes.TodosDeleteRouteParams;
  Connect: undefined;
}

export type NavigationRoot = NativeStackNavigationProp<NavigationParams>;
