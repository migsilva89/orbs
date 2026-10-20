import type * as ChatTypes from '@/types/chat.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export interface NavigationParams extends Record<string, object | undefined> {
  Bots: undefined;
  Chat: ChatTypes.ChatRouteParams;
  MessageActions: ChatTypes.ChatActionsRouteParams;
  ReactionPicker: ChatTypes.ChatReactionParams;
  MessageText: ChatTypes.ChatTextRouteParams;
  Connect: undefined;
}

export type NavigationRoot = NativeStackNavigationProp<NavigationParams>;
