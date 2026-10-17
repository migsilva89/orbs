import { errorSchemas } from '@openbots/errors/universal';
import { asyncIteratorObject, oc } from '@orpc/contract';
import {
  authGrant,
  authGrantStatus,
  authPair,
  authPairResult,
  authRedeem,
  authRedeemResult,
} from '../types/auth.types';
import { bot, botCreate, botGet, botList, botModelList, botUpdate } from '../types/bot.types';
import {
  conversationFrame,
  conversationHistory,
  conversationHistoryResult,
  conversationStopResult,
  conversationSubmit,
  conversationSubmitResult,
  conversationTarget,
} from '../types/conversation.types';
import { deviceList, deviceRevoke, deviceRevokeResult } from '../types/device.types';
import { resourceCatalog, resourceConfigure, resourceDiscover, resourceSettings } from '../types/resource.types';
import {
  toolAnswer,
  toolAnswerResult,
  toolApprovalList,
  toolConfigure,
  toolPending,
  toolSettings,
} from '../types/tool.types';

export const contract = {
  resources: {
    discover: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(resourceDiscover)
      .output(resourceCatalog),

    settings: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .output(resourceSettings),

    configure: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .input(resourceConfigure)
      .output(resourceSettings),
  },

  tools: {
    settings: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .output(toolSettings),

    configure: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .input(toolConfigure)
      .output(toolSettings),

    pending: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(toolPending)
      .output(toolApprovalList),

    answer: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(toolAnswer)
      .output(toolAnswerResult),
  },

  bots: {
    list: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .output(botList),

    models: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .output(botModelList),

    get: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(botGet)
      .output(bot),

    create: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        CONFLICT: errorSchemas.CONFLICT,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
      })
      .input(botCreate)
      .output(bot),

    update: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        CONFLICT: errorSchemas.CONFLICT,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
      })
      .input(botUpdate)
      .output(bot),
  },

  pairing: {
    create: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .input(authPair)
      .output(authPairResult),

    redeem: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .input(authRedeem)
      .output(authRedeemResult),

    status: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(authGrantStatus)
      .output(authGrant),
  },

  conversation: {
    history: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
      })
      .input(conversationHistory)
      .output(conversationHistoryResult),

    submit: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        CONFLICT: errorSchemas.CONFLICT,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(conversationSubmit)
      .output(conversationSubmitResult),

    stop: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(conversationTarget)
      .output(conversationStopResult),

    watch: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(conversationTarget)
      .output(asyncIteratorObject(conversationFrame)),
  },

  devices: {
    list: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .output(deviceList),

    revoke: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .input(deviceRevoke)
      .output(deviceRevokeResult),
  },
};
