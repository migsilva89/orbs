import { createStaticNavigation } from '@react-navigation/native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ContextConnection } from '@/components/context/context-connection';
import { useNavigationTheme } from '@/hooks/use-navigation-theme';
import { RootStack } from './navigation';
import './styles.css';

const Navigation = createStaticNavigation(RootStack);

export function App() {
  const theme = useNavigationTheme();

  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        <ContextConnection>
          <Navigation theme={theme} />
        </ContextConnection>
      </SafeAreaProvider>
    </KeyboardProvider>
  );
}
