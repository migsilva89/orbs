import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BotList } from '@/components/bots/bot-list';
import { ConnectIntro } from '@/components/connect/connect-intro';
import { useConnectionIsConnected, useConnectionIsDisconnected } from '@/hooks/use-connection';

export const RootStack = createNativeStackNavigator({
  screenOptions: { headerShown: false },
  groups: {
    Connected: {
      if: useConnectionIsConnected,
      screens: { Bots: BotList },
    },
    Disconnected: {
      if: useConnectionIsDisconnected,
      screens: { Connect: ConnectIntro },
    },
  },
});
