import { bots } from './rpc.bots';
import { conversation } from './rpc.conversation';
import { devices } from './rpc.devices';
import { pairing } from './rpc.pairing';
import { baseRouter } from './rpc.procedures';
import { resources } from './rpc.resources';
import { tools } from './rpc.tools';

export const router = baseRouter.router({
  bots,
  devices,
  conversation,
  pairing,
  tools,
  resources,
});
