import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConnectIntro } from '@/components/connect/connect-intro';

export const RootStack = createNativeStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    Connect: ConnectIntro,
  },
});
