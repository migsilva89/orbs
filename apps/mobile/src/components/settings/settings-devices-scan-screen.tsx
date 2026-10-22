import { authPairCode } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { match, P } from 'ts-pattern';
import { Button } from '@/components/ui/button';
import { Empty } from '@/components/ui/empty';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useConnection } from '@/hooks/use-connection';
import { BRAND_APP_NAME } from '@/services/brand/brand.constants';
import { connectionPair } from '@/services/connection/connection.client';
import { connectionCodeFromUrl } from '@/services/connection/connection.utils';
import type { BarcodeScanningResult } from 'expo-camera';

export function SettingsDevicesScanScreen() {
  const router = useRouter();
  const { connect } = useConnection();
  const [permission, requestPermission] = useCameraPermissions();
  const scanned = useRef<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [isPairing, setIsPairing] = useState(false);

  async function handleScanned({ data }: BarcodeScanningResult) {
    if (data === scanned.current) {
      return;
    }

    scanned.current = data;
    const payload = authPairCode.safeParse(connectionCodeFromUrl(data) ?? data);

    if (!payload.success) {
      setProblem(m.connect_code_invalid());
      return;
    }

    setProblem(null);
    setIsPairing(true);
    try {
      connect(await connectionPair({ payload: payload.data, name: m.mobile_device_name_default() }));
      router.dismissTo('/');
    } catch {
      setProblem(m.connect_failed());
    } finally {
      setIsPairing(false);
    }
  }

  return match(permission)
    .with(P.nullish, () => null)
    .with({ granted: true }, () => (
      <View className="flex-1 bg-black">
        <CameraView
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={(result) => void handleScanned(result)}
        />
        <View className="flex-1 items-center justify-center gap-6 px-8" pointerEvents="none">
          <View className="size-64 items-center justify-center rounded-3xl border-2 border-white/80">
            {isPairing ? <ActivityIndicator color="white" /> : null}
          </View>
          <Text className="text-center" tone="on-blue">{isPairing ? m.mobile_scan_pairing() : m.mobile_scan_hint()}</Text>
          {problem ? (
            <Text
              accessibilityRole="alert"
              className="text-center"
              tone="destructive"
            >
              {problem}
            </Text>
          ) : null}
        </View>
      </View>
    ))
    .otherwise((current) => (
      <View className="flex-1 bg-background px-4">
        <Empty
          action={match(current.canAskAgain)
            .with(true, () => (
              <Button onPress={() => void requestPermission()}>
                <Icon icon={Camera} size="sm" />
                {m.mobile_scan_permission_allow()}
              </Button>
            ))
            .with(false, () => (
              <Button variant="outline" onPress={() => void Linking.openSettings()}>
                {m.mobile_scan_permission_settings()}
              </Button>
            ))
            .exhaustive()}
          description={m.mobile_scan_permission_description({ name: BRAND_APP_NAME })}
          icon={(
            <Icon
              icon={Camera}
              size="lg"
              tone="muted"
            />
          )}
          title={m.mobile_scan_permission_title()}
        />
      </View>
    ));
}
