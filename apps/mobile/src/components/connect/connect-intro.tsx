import { m } from '@openbots/i18n/client';
import { Lock } from 'lucide-react-native';
import { View } from 'react-native';
import { match } from 'ts-pattern';
import { Brand } from '@/components/ui/brand';
import { BrandMark } from '@/components/ui/brand-mark';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { LabelDescription } from '@/components/ui/label';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useConnection } from '@/hooks/use-connection';
import { ConnectForm } from './connect-form';

export function ConnectIntro() {
  const { isLoading, error, restore } = useConnection();

  return (
    <Screen
      centered
      keyboard
      variant="muted"
    >
      <View className="mx-auto w-full max-w-sm">
        <Card className="overflow-hidden">
          <CardHeader variant="centered">
            <View className="mb-4 items-center gap-2">
              <BrandMark />
              <Brand size="lg" />
            </View>
            <CardTitle className="text-center" size="lg">{m.connect_title()}</CardTitle>
            <CardDescription className="text-center" variant="plain">{m.mobile_connect_description({ name: m.layout_brand() })}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {match(isLoading)
              .with(true, () => <LabelDescription>{m.mobile_connection_loading()}</LabelDescription>)
              .with(false, () => <ConnectForm />)
              .exhaustive()}
            {error ? (
              <View className="mt-4 gap-3">
                <LabelDescription accessibilityRole="alert" variant="error">{error}</LabelDescription>
                <Button variant="ghost" onPress={() => void restore()}>{m.mobile_connection_retry()}</Button>
              </View>
            ) : null}
          </CardContent>
        </Card>
        <View className="mt-4 flex-row justify-center gap-1">
          <Icon
            icon={Lock}
            size="xs"
            tone="muted"
          />
          <Text
            className="shrink text-center"
            tone="muted"
            variant="caption"
          >{m.connect_privacy_proof({ name: m.layout_brand() })}</Text>
        </View>
      </View>
    </Screen>
  );
}
