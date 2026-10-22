import { m } from '@repo/i18n/client';
import { ScrollView, View } from 'react-native';
import { match } from 'ts-pattern';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

interface BotLoadStateProps {
  isError: boolean;
  isMissing: boolean;
  onRetry: () => void;
}

export function BotLoadState({ isError, isMissing, onRetry }: BotLoadStateProps) {
  const content = match({ isError, isMissing })
    .with({ isError: true }, () => (
      <View className="gap-4 px-5 pt-10">
        <Alert variant="destructive">
          <AlertTitle>{m.mobile_bot_error_title()}</AlertTitle>
          <AlertDescription>{m.mobile_bots_failed()}</AlertDescription>
        </Alert>
        <Button onPress={onRetry}>{m.mobile_retry()}</Button>
      </View>
    ))
    .with({ isMissing: true }, () => <Text className="mx-5 mt-10 text-center" tone="muted">{m.mobile_bot_missing()}</Text>)
    .otherwise(() => (
      <View accessibilityLabel={m.mobile_bot_loading()} className="items-center px-5 pt-10">
        <Text tone="muted">{m.mobile_bot_loading()}</Text>
      </View>
    ));

  return <ScrollView contentInsetAdjustmentBehavior="automatic">{content}</ScrollView>;
}
