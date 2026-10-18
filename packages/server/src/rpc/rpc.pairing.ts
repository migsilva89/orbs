import { authedRouter, baseRouter } from './rpc.procedures';

export const pairing = baseRouter.pairing.router({
  create: authedRouter.pairing.create.handler(async ({ context, input }) => {
    return context.auth.actions.pair({ ...input, issuedBy: context.device.id });
  }),
  bootstrap: baseRouter.pairing.bootstrap.handler(async ({ context, input }) => {
    return context.auth.actions.bootstrap({ ...input, isLocal: context.isLocal });
  }),
  redeem: baseRouter.pairing.redeem.handler(async ({ context, input }) => context.auth.actions.redeem(input)),
  status: authedRouter.pairing.status.handler(async ({ context, input }) => context.auth.queries.grant(input)),
});
