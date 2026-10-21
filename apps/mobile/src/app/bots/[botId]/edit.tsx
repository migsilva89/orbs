import { useLocalSearchParams } from 'expo-router';
import { BotSettingsScreen } from '@/components/bots/bot-settings-screen';
import type { BotDetailsRouteParams } from '@/types/bot-details.types';

export default function BotEditRoute() {
  const { botId } = useLocalSearchParams<BotDetailsRouteParams>();

  return <BotSettingsScreen botId={botId} />;
}
