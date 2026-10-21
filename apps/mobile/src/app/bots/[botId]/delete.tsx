import { useLocalSearchParams } from 'expo-router';
import { BotDeleteDialog } from '@/components/bots/bot-delete-dialog';
import type { BotDetailsRouteParams } from '@/types/bot-details.types';

export default function BotDeleteRoute() {
  const { botId } = useLocalSearchParams<BotDetailsRouteParams>();

  return <BotDeleteDialog botId={botId} />;
}
