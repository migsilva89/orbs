import { m } from '@openbots/i18n/client';
import { Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);

export function ConnectIntro() {
  return (
    <SafeAreaView className="flex-1 bg-muted">
      <View className="flex-1 items-center justify-center gap-1 p-6">
        <Text className="font-sans text-xl font-semibold text-foreground">{m.connect_title()}</Text>
        <Text className="text-center font-sans text-xs text-muted-foreground">{m.connect_code_hint()}</Text>
      </View>
    </SafeAreaView>
  );
}
