import { conversation } from './rpc.conversation';
import { devices } from './rpc.devices';
import { pairing } from './rpc.pairing';
import { baseRouter } from './rpc.procedures';

export const router = baseRouter.router({
  devices,
  conversation,
  pairing,
});
