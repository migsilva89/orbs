import { useLocalSearchParams } from 'expo-router';
import { BotDetailsScreen } from '@/components/bots/bot-details-screen';
import type { BotDetailsRouteParams } from '@/types/bot-details.types';

export default function BotTodosRoute() {
  const { botId } = useLocalSearchParams<BotDetailsRouteParams>();

  return <BotDetailsScreen botId={botId} page="todos" />;
}
