import { createStaticNavigation } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useNavigationTheme } from '@/hooks/use-navigation-theme';
import { RootStack } from './navigation';
import './styles.css';

const Navigation = createStaticNavigation(RootStack);

export function App() {
  const theme = useNavigationTheme();

  return (
    <SafeAreaProvider>
      <Navigation theme={theme} />
    </SafeAreaProvider>
  );
}
