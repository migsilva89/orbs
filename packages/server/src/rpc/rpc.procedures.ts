import { contract } from '@openbots/contracts/universal';
import { implement } from '@orpc/server';
import type { RpcContext } from '../types/rpc.types';

export const baseRouter = implement(contract).$context<RpcContext>();

export const authedRouter = baseRouter.use(async ({ context, next }) => {
  const authorization = context.reqHeaders?.get('authorization');
  const device = await context.auth.queries.authenticate({ authorization });

  return next({ context: { device } });
});
