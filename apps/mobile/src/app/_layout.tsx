import { m } from '@openbots/i18n/client';
import { bootZodErrors } from '@openbots/i18n/validation';
import { Stack, ThemeProvider } from 'expo-router';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ContextConnection } from '@/components/context/context-connection';
import { ContextToast } from '@/components/context/context-toast';
import { useConnectionIsConnected } from '@/hooks/use-connection';
import { useNavigationTheme } from '@/hooks/use-navigation-theme';
import '@/application/styles.css';

bootZodErrors();

export const unstable_settings = { anchor: 'index' };

const SHEET = { presentation: 'formSheet', sheetGrabberVisible: true, sheetCornerRadius: 32 } as const;
const SHEET_FIT = { ...SHEET, sheetAllowedDetents: 'fitToContents' } as const;
const DIALOG = { presentation: 'transparentModal', animation: 'fade' } as const;

export default function RootLayout() {
  const theme = useNavigationTheme();

  return (
    <KeyboardProvider>
      <ThemeProvider value={theme}>
        <ContextToast>
          <ContextConnection>
            <RootLayoutStack />
          </ContextConnection>
        </ContextToast>
      </ThemeProvider>
    </KeyboardProvider>
  );
}

function RootLayoutStack() {
  const isConnected = useConnectionIsConnected();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isConnected}>
        <Stack.Screen name="index" />
        <Stack.Screen name="chat/[botId]/index" />
        <Stack.Screen name="chat/[botId]/message" options={SHEET_FIT} />
        <Stack.Screen name="chat/[botId]/react" options={{ ...SHEET, sheetAllowedDetents: [0.6, 1] }} />
        <Stack.Screen name="chat/[botId]/text" options={{ ...SHEET, sheetAllowedDetents: [0.9] }} />
        <Stack.Screen name="chat/[botId]/reset" options={DIALOG} />
        <Stack.Screen name="bots/[botId]/details" options={{ ...SHEET, sheetAllowedDetents: [0.6, 1] }} />
        <Stack.Screen name="bots/[botId]/edit" options={{ headerShown: true, title: m.rooms_action_edit_bot(), headerBackButtonDisplayMode: 'minimal' }} />
        <Stack.Screen name="bots/[botId]/delete" options={DIALOG} />
        <Stack.Screen name="bots/[botId]/todos/[todoId]/delete" options={DIALOG} />
      </Stack.Protected>
      <Stack.Protected guard={!isConnected}>
        <Stack.Screen name="connect" />
      </Stack.Protected>
    </Stack>
  );
}
