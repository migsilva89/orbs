import { bots } from './rpc.bots';
import { conversation } from './rpc.conversation';
import { devices } from './rpc.devices';
import { mcp } from './rpc.mcp';
import { pairing } from './rpc.pairing';
import { baseRouter } from './rpc.procedures';
import { skills } from './rpc.skills';
import { tools } from './rpc.tools';

export const router = baseRouter.router({
  bots,
  devices,
  conversation,
  pairing,
  tools,
  skills,
  mcp,
});
