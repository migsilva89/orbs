import { bots } from './rpc.bots';
import { commands } from './rpc.commands';
import { conversation } from './rpc.conversation';
import { devices } from './rpc.devices';
import { instructions } from './rpc.instructions';
import { mcp } from './rpc.mcp';
import { models } from './rpc.models';
import { pairing } from './rpc.pairing';
import { plugins } from './rpc.plugins';
import { baseRouter } from './rpc.procedures';
import { rpcServer } from './rpc.server';
import { skills } from './rpc.skills';
import { tools } from './rpc.tools';

export const router = baseRouter.router({
  server: rpcServer,
  bots,
  commands,
  devices,
  conversation,
  pairing,
  tools,
  skills,
  plugins,
  instructions,
  mcp,
  models,
});
