import { useNavigation } from 'expo-router';
import type { ChatRouteParams } from '@/types/chat.types';
import type { NativeStackNavigationProp } from 'expo-router';

export function useChatReturn() {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, ChatRouteParams>>>();

  return (params: ChatRouteParams) => navigation.popTo('chat/[botId]/index', params, { merge: true });
}
