import { defineExtension } from '@earendil-works/pi-durable';
import { routineTask } from './routine.task';

export function makeRoutineExtensionService() {
  return { extension: defineExtension({ name: 'bots.routines', tasks: [routineTask] }) };
}

export type RoutineExtensionService = ReturnType<typeof makeRoutineExtensionService>;
