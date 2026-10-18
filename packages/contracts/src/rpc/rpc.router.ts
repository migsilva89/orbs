import { errorSchemas } from '@openbots/errors/universal';
import { asyncIteratorObject, oc as baseContract } from '@orpc/contract';
import {
  authGrant,
  authGrantStatus,
  authPair,
  authPairResult,
  authRedeem,
  authRedeemResult,
} from '../types/auth.types';
import { bot, botCatalog, botCreate, botGet, botList, botUpdate } from '../types/bot.types';
import { commandCatalog, commandExecute, commandExecuteResult, commandList } from '../types/command.types';
import { conversationContextUsage } from '../types/context-usage.types';
import {
  conversationContextPage,
  conversationContexts,
  conversationFrame,
  conversationHistory,
  conversationHistoryResult,
  conversationList,
  conversationMarkRead,
  conversationPreferences,
  conversationSetPinned,
  conversationStopResult,
  conversationSubmit,
  conversationSubmitResult,
  conversationTarget,
} from '../types/conversation.types';
import { deviceList, deviceRevoke, deviceRevokeResult } from '../types/device.types';
import { instructionCatalog, instructionConfigure, instructionDiscover, instructionSettings } from '../types/instruction.types';
import { mcpCatalog, mcpConfigure, mcpDiscover, mcpSettings } from '../types/mcp.types';
import { modelList } from '../types/model.types';
import { pluginCatalog, pluginConfigure, pluginDiscover, pluginSettings } from '../types/plugin.types';
import { serverInfo } from '../types/server.types';
import { skillCatalog, skillConfigure, skillDiscover, skillSettings } from '../types/skill.types';
import {
  toolAnswer,
  toolAnswerResult,
  toolApprovalList,
  toolConfigure,
  toolPending,
  toolSettings,
} from '../types/tool.types';
import { conversationUsage } from '../types/usage.types';

const oc = baseContract.errors({
  PROTOCOL_MISMATCH: errorSchemas.PROTOCOL_MISMATCH,
  SERVER_MISMATCH: errorSchemas.SERVER_MISMATCH,
});

export const contract = {
  server: {
    info: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .output(serverInfo),
  },

  models: {
    list: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .output(modelList),
  },

  commands: {
    list: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(commandList)
      .output(commandCatalog),

    execute: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(commandExecute)
      .output(commandExecuteResult),
  },

  plugins: {
    discover: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(pluginDiscover)
      .output(pluginCatalog),

    settings: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .output(pluginSettings),

    configure: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .input(pluginConfigure)
      .output(pluginSettings),
  },

  instructions: {
    discover: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(instructionDiscover)
      .output(instructionCatalog),

    settings: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .output(instructionSettings),

    configure: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .input(instructionConfigure)
      .output(instructionSettings),
  },

  skills: {
    discover: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(skillDiscover)
      .output(skillCatalog),

    settings: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .output(skillSettings),

    configure: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .input(skillConfigure)
      .output(skillSettings),
  },

  mcp: {
    discover: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(mcpDiscover)
      .output(mcpCatalog),

    settings: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .output(mcpSettings),

    configure: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .input(mcpConfigure)
      .output(mcpSettings),
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

    catalog: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(botGet)
      .output(botCatalog),
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
    contextUsage: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(conversationTarget)
      .output(conversationContextUsage),

    watchContexts: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(conversationTarget)
      .output(asyncIteratorObject(conversationFrame)),

    usage: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(conversationTarget)
      .output(conversationUsage),

    contexts: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
      })
      .input(conversationContexts)
      .output(conversationContextPage),

    markRead: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(conversationMarkRead)
      .output(conversationPreferences),

    setPinned: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(conversationSetPinned)
      .output(conversationPreferences),

    watchList: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .output(asyncIteratorObject(conversationFrame)),

    list: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .output(conversationList),

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
