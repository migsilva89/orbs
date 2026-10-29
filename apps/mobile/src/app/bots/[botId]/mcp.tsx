import { useLocalSearchParams } from 'expo-router';
import { BotSharedScreen } from '@/components/bots/bot-shared-screen';
import type { BotDetailsRouteParams } from '@/types/bot-details.types';

export default function BotMcpRoute() {
  const { botId } = useLocalSearchParams<BotDetailsRouteParams>();

  return <BotSharedScreen botId={botId} resource="mcp" />;
}
