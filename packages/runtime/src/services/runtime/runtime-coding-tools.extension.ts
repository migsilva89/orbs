import { defineExtension } from '@earendil-works/pi-durable';
import { createBashTool, createEditTool, createReadTool, createWriteTool } from '@earendil-works/pi-durable/tools';
import type { RuntimeCodingToolsParams } from '../../types/runtime.types';

export function runtimeCodingToolsExtension({ images, secrets }: RuntimeCodingToolsParams) {
  return defineExtension({
    name: 'coding-tools',
    tools: [
      createReadTool({ images }),
      createWriteTool(),
      createEditTool(),
      createBashTool({ prepare: secrets && ((execution) => secrets.actions.prepare(execution)) }),
    ],
  });
}
