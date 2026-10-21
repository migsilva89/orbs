import { useLocalSearchParams } from 'expo-router';
import { RoutinesDeleteDialog } from '@/components/routines/routines-delete-dialog';
import type { RoutinesRouteParams } from '@/types/routines.types';

export default function RoutinesDeleteRoute() {
  const { botId, routineId } = useLocalSearchParams<RoutinesRouteParams>();

  return <RoutinesDeleteDialog botId={botId} routineId={routineId} />;
}
