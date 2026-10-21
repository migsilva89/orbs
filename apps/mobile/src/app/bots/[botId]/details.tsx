import { useLocalSearchParams } from 'expo-router';
import { BotDetailsSheet } from '@/components/bots/bot-details-sheet';
import type { BotDetailsRouteParams } from '@/types/bot-details.types';

export default function BotDetailsRoute() {
  const { botId } = useLocalSearchParams<BotDetailsRouteParams>();

  return <BotDetailsSheet botId={botId} />;
}
