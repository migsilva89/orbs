import { authedRouter, baseRouter } from './rpc.procedures';

export const pairing = {
  create: authedRouter.pairing.create.handler(async ({ context }) => {
    const { id, addresses } = await context.server.queries.info();

    return context.auth.actions.pair({
      serverId: id,
      addresses,
      issuedBy: context.device.id,
    });
  }),
  bootstrap: baseRouter.pairing.bootstrap.handler(async ({ context }) => {
    const { id, addresses } = await context.server.queries.info();

    return context.auth.actions.bootstrap({
      serverId: id,
      addresses,
      isLocal: context.isLocal,
    });
  }),
  redeem: baseRouter.pairing.redeem.handler(async ({ context, input }) => context.auth.actions.redeem(input)),
  status: authedRouter.pairing.status.handler(async ({ context, input }) => context.auth.queries.grant(input)),
};
