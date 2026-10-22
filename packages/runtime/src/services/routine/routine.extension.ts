import { defineExtension } from '@earendil-works/pi-durable';
import { routineTask } from './routine.task';

export const routineExtension = defineExtension({ name: 'openbots.routines', tasks: [routineTask] });
