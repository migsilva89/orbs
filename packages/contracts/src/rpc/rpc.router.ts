import { errorSchemas } from '@openbots/errors/universal';
import { asyncIteratorObject, oc } from '@orpc/contract';
import { authGrant, authGrantStatus, authPair, authPairResult, authRedeem, authRedeemResult } from '../types/auth.types';
import { conversationFrame } from '../types/conversation.types';
import { deviceList, deviceRevoke, deviceRevokeResult } from '../types/device.types';

export const contract = {
  pairing: {
    create: oc.errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED }).input(authPair).output(authPairResult),
    redeem: oc.errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED }).input(authRedeem).output(authRedeemResult),
    status: oc.errors({
      UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
      NOT_FOUND: errorSchemas.NOT_FOUND,
    }).input(authGrantStatus).output(authGrant),
  },
  conversation: {
    watch: oc.errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED }).output(asyncIteratorObject(conversationFrame)),
  },
  devices: {
    list: oc.errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED }).output(deviceList),
    revoke: oc.errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED }).input(deviceRevoke).output(deviceRevokeResult),
  },
};
