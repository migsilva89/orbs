import { artifacts } from './rpc.artifacts';
import { attachments } from './rpc.attachments';
import { bots } from './rpc.bots';
import { commands } from './rpc.commands';
import { conversation } from './rpc.conversation';
import { credentials } from './rpc.credentials';
import { devices } from './rpc.devices';
import { instructions } from './rpc.instructions';
import { limits } from './rpc.limits';
import { mcp } from './rpc.mcp';
import { mcpAuth } from './rpc.mcp-auth';
import { models } from './rpc.models';
import { pairing } from './rpc.pairing';
import { plugins } from './rpc.plugins';
import { rpcRouter } from './rpc.procedures';
import { providers } from './rpc.providers';
import { routines } from './rpc.routines';
import { rpcServer } from './rpc.server';
import { skills } from './rpc.skills';
import { tools } from './rpc.tools';

export const router = rpcRouter.router({
  server: rpcServer,
  limits,
  providers,
  mcpAuth,
  routines,
  attachments,
  artifacts,
  bots,
  commands,
  devices,
  conversation,
  credentials,
  pairing,
  tools,
  skills,
  plugins,
  instructions,
  mcp,
  models,
});
