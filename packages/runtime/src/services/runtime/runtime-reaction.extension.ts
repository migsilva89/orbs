import { defineExtension } from '@earendil-works/pi-durable';
import { runtimeReactionTask } from './runtime-reaction.task';

export const runtimeReactionExtension = defineExtension({ name: 'bots.reactions', tasks: [runtimeReactionTask] });
