import { contract, SERVER_PROTOCOL } from '@openbots/contracts/universal';
import { implement } from '@orpc/server';
import type { RpcContext } from '../types/rpc.types';

export const baseRouter = implement(contract).$context<RpcContext>().use(async ({ context, next }) => {
  await context.server.queries.validateConnection({
    protocolVersion: context.reqHeaders?.get(SERVER_PROTOCOL.versionHeader) ?? null,
    serverId: context.reqHeaders?.get(SERVER_PROTOCOL.serverIdHeader) ?? null,
  });

  return next();
});

export const authedRouter = baseRouter.use(async ({ context, next }) => {
  const authorization = context.reqHeaders?.get('authorization');
  const device = await context.auth.queries.authenticate({ authorization });

  return next({ context: { device } });
});
