import { defineDoc } from '@earendil-works/pi-durable';
import type { RoutineDocument } from '../../types/routine.types';

export const routineDocument = defineDoc<RoutineDocument>({
  kind: 'bots.routines',
  version: 1,
  scope: 'conversation',
  history: 'latest',
  fork: 'initial',
  initial: () => ({ routines: {} }),
});
