import { implement } from '@orpc/server';
import { contract, SERVER_PROTOCOL } from '@repo/contracts/universal';
import { match } from 'ts-pattern';
import { rpcLimitOutput } from './rpc-limit.utils';
import type { RpcContext } from '../types/rpc.types';

export const rpcRouter = implement(contract).$context<RpcContext>();

export const baseRouter = rpcRouter.use(async ({ context, next, path }) => {
  await context.limits.throttle({ kind: 'public', peer: context.peerAddress });
  await match(path.join('.'))
    .with('pairing.redeem', () => context.limits.throttle({ kind: 'redeem', peer: context.peerAddress }))
    .otherwise(() => undefined);
  const lease = context.limits.acquire({ kind: 'rpc' });

  try {
    await context.server.queries.validateConnection({
      protocolVersion: context.reqHeaders?.get(SERVER_PROTOCOL.versionHeader) ?? null,
      serverId: context.reqHeaders?.get(SERVER_PROTOCOL.serverIdHeader) ?? null,
    });

    return await next();
  } finally {
    lease.release();
  }
});

export const authedRouter = baseRouter.use(async ({ context, next, signal }) => {
  const authorization = context.reqHeaders?.get('authorization');
  const device = await context.auth.queries.authenticate({ authorization });
  await context.limits.throttle({ kind: 'device', deviceId: device.id });

  const result = await next({ context: { device } });

  const output = await rpcLimitOutput({
    limits: context.limits,
    auth: context.auth,
    deviceId: device.id,
    authorization,
    output: result.output,
    signal,
  });

  return { ...result, output };
});
