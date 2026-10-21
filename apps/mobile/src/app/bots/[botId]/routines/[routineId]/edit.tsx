import { useLocalSearchParams } from 'expo-router';
import { RoutinesEditScreen } from '@/components/routines/routines-edit-screen';
import type { RoutinesRouteParams } from '@/types/routines.types';

export default function RoutinesEditRoute() {
  const { botId, routineId } = useLocalSearchParams<RoutinesRouteParams>();

  return <RoutinesEditScreen botId={botId} routineId={routineId} />;
}
