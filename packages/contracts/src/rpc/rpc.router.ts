import { errorSchemas } from '@openbots/errors/universal';
import { asyncIteratorObject, oc as baseContract } from '@orpc/contract';
import {
  artifact,
  artifactBlocks,
  artifactCreate,
  artifactGet,
  artifactList,
  artifactListInput,
  artifactRestore,
  artifactSaveState,
  artifactUpdate,
  artifactVersionList,
  artifactVersionsInput,
} from '../types/artifact.types';
import { attachment, attachmentDownload, attachmentGet, attachmentList, attachmentPage, attachmentRemoveResult, attachmentUpload } from '../types/attachment.types';
import {
  authGrant,
  authGrantStatus,
  authPair,
  authPairResult,
  authRedeem,
  authRedeemResult,
} from '../types/auth.types';
import { bot, botCatalog, botCreate, botDeleteResult, botGet, botList, botSwapModels, botSwapModelsResult, botUpdate } from '../types/bot.types';
import { commandCatalog, commandExecute, commandExecuteResult, commandList } from '../types/command.types';
import { conversationContextUsage } from '../types/context-usage.types';
import { conversationArrange, conversationArrangeResult, conversationSetHidden, conversationSetMuted } from '../types/conversation-preference.types';
import {
  conversationClearResult,
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
  conversationUpdateSubmission,
  conversationUpdateSubmissionResult,
} from '../types/conversation.types';
import { credentialsList, credentialsSet, credentialsSetResult } from '../types/credentials.types';
import { deviceList, deviceRevoke, deviceRevokeResult } from '../types/device.types';
import { conversationSearch, conversationSearchResult } from '../types/history.types';
import { instructionCatalog, instructionConfigure, instructionDiscover, instructionSettings } from '../types/instruction.types';
import { limitConfigure, limitSettings } from '../types/limit.types';
import {
  mcpAuthCancelResult,
  mcpAuthComplete,
  mcpAuthCompleteResult,
  mcpAuthLogoutResult,
  mcpAuthStart,
  mcpAuthStartResult,
  mcpAuthStatusResult,
  mcpAuthTarget,
} from '../types/mcp-auth.types';
import { mcpCatalog, mcpConfigure, mcpDiscover, mcpSettings } from '../types/mcp.types';
import { modelList } from '../types/model.types';
import { pluginCatalog, pluginConfigure, pluginDiscover, pluginSettings } from '../types/plugin.types';
import { providerCancelResult, providerComplete, providerList, providerLogin, providerLogout, providerLogoutResult, providerSession, providerSessionId } from '../types/provider.types';
import { conversationAnswerQuestion, conversationAnswerQuestionResult, conversationQuestionList } from '../types/question.types';
import { conversationReactions, conversationReactionsResult, conversationSetReaction, conversationSetReactionResult } from '../types/reaction.types';
import { routine, routineCreate, routineList, routineRemoveResult, routineTarget, routineUpdate } from '../types/routine.types';
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
  RATE_LIMITED: errorSchemas.RATE_LIMITED,
  PROTOCOL_MISMATCH: errorSchemas.PROTOCOL_MISMATCH,
  SERVER_MISMATCH: errorSchemas.SERVER_MISMATCH,
});

export const contract = {
  providers: {
    list: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .output(providerList),
    login: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        FORBIDDEN: errorSchemas.FORBIDDEN,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        CONFLICT: errorSchemas.CONFLICT,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
      })
      .input(providerLogin)
      .output(providerSession),
    complete: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        FORBIDDEN: errorSchemas.FORBIDDEN,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        CONFLICT: errorSchemas.CONFLICT,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
      })
      .input(providerComplete)
      .output(providerSession),
    session: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED, NOT_FOUND: errorSchemas.NOT_FOUND })
      .input(providerSessionId)
      .output(providerSession),
    cancel: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        FORBIDDEN: errorSchemas.FORBIDDEN,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        CONFLICT: errorSchemas.CONFLICT,
      })
      .input(providerSessionId)
      .output(providerCancelResult),
    logout: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED, NOT_FOUND: errorSchemas.NOT_FOUND })
      .input(providerLogout)
      .output(providerLogoutResult),
  },
  limits: {
    settings: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .output(limitSettings),
    configure: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .input(limitConfigure)
      .output(limitSettings),
  },
  mcpAuth: {
    start: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        FORBIDDEN: errorSchemas.FORBIDDEN,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        CONFLICT: errorSchemas.CONFLICT,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
      })
      .input(mcpAuthStart)
      .output(mcpAuthStartResult),
    complete: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        FORBIDDEN: errorSchemas.FORBIDDEN,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        CONFLICT: errorSchemas.CONFLICT,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
      })
      .input(mcpAuthComplete)
      .output(mcpAuthCompleteResult),
    cancel: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        FORBIDDEN: errorSchemas.FORBIDDEN,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(mcpAuthTarget)
      .output(mcpAuthCancelResult),
    logout: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED, NOT_FOUND: errorSchemas.NOT_FOUND })
      .input(mcpAuthTarget)
      .output(mcpAuthLogoutResult),
    status: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED, NOT_FOUND: errorSchemas.NOT_FOUND })
      .input(mcpAuthTarget)
      .output(mcpAuthStatusResult),
  },
  credentials: {
    list: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .output(credentialsList),
    set: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .input(credentialsSet)
      .output(credentialsSetResult),
  },
  artifacts: {
    blocks: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .output(artifactBlocks),
    list: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED, NOT_FOUND: errorSchemas.NOT_FOUND })
      .input(artifactListInput)
      .output(artifactList),
    get: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED, NOT_FOUND: errorSchemas.NOT_FOUND })
      .input(artifactGet)
      .output(artifact),
    versions: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED, NOT_FOUND: errorSchemas.NOT_FOUND })
      .input(artifactVersionsInput)
      .output(artifactVersionList),
    create: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        CONFLICT: errorSchemas.CONFLICT,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
      })
      .input(artifactCreate)
      .output(artifact),
    update: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        CONFLICT: errorSchemas.CONFLICT,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
      })
      .input(artifactUpdate)
      .output(artifact),
    saveState: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        CONFLICT: errorSchemas.CONFLICT,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
      })
      .input(artifactSaveState)
      .output(artifact),
    restore: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        CONFLICT: errorSchemas.CONFLICT,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
      })
      .input(artifactRestore)
      .output(artifact),
  },
  routines: {
    list: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED, NOT_FOUND: errorSchemas.NOT_FOUND })
      .input(botGet)
      .output(routineList),
    create: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
      })
      .input(routineCreate)
      .output(routine),
    update: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
      })
      .input(routineUpdate)
      .output(routine),
    run: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        CONFLICT: errorSchemas.CONFLICT,
      })
      .input(routineTarget)
      .output(routine),
    remove: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED, NOT_FOUND: errorSchemas.NOT_FOUND })
      .input(routineTarget)
      .output(routineRemoveResult),
  },
  attachments: {
    upload: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(attachmentUpload)
      .output(attachment),
    download: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED, NOT_FOUND: errorSchemas.NOT_FOUND })
      .input(attachmentGet)
      .output(attachmentDownload),
    list: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED, NOT_FOUND: errorSchemas.NOT_FOUND })
      .input(attachmentList)
      .output(attachmentPage),
    remove: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        CONFLICT: errorSchemas.CONFLICT,
      })
      .input(attachmentGet)
      .output(attachmentRemoveResult),
  },
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
        CONFLICT: errorSchemas.CONFLICT,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
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
    swapModels: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        CONFLICT: errorSchemas.CONFLICT,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
      })
      .input(botSwapModels)
      .output(botSwapModelsResult),

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

    delete: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(botGet)
      .output(botDeleteResult),

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

    bootstrap: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        CONFLICT: errorSchemas.CONFLICT,
      })
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
    watchNotifications: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED })
      .output(asyncIteratorObject(conversationFrame)),

    search: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
      })
      .input(conversationSearch)
      .output(conversationSearchResult),
    questions: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED, NOT_FOUND: errorSchemas.NOT_FOUND })
      .input(conversationTarget)
      .output(conversationQuestionList),
    answerQuestion: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED, NOT_FOUND: errorSchemas.NOT_FOUND })
      .input(conversationAnswerQuestion)
      .output(conversationAnswerQuestionResult),
    setReaction: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
      })
      .input(conversationSetReaction)
      .output(conversationSetReactionResult),
    reactions: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED, NOT_FOUND: errorSchemas.NOT_FOUND })
      .input(conversationReactions)
      .output(conversationReactionsResult),
    setHidden: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED, NOT_FOUND: errorSchemas.NOT_FOUND })
      .input(conversationSetHidden)
      .output(conversationPreferences),
    setMuted: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED, NOT_FOUND: errorSchemas.NOT_FOUND })
      .input(conversationSetMuted)
      .output(conversationPreferences),
    arrange: oc
      .errors({ UNAUTHORIZED: errorSchemas.UNAUTHORIZED, NOT_FOUND: errorSchemas.NOT_FOUND })
      .input(conversationArrange)
      .output(conversationArrangeResult),

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

    updateSubmission: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        CONFLICT: errorSchemas.CONFLICT,
        NOT_FOUND: errorSchemas.NOT_FOUND,
        VALIDATION_ERROR: errorSchemas.VALIDATION_ERROR,
      })
      .input(conversationUpdateSubmission)
      .output(conversationUpdateSubmissionResult),

    stop: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(conversationTarget)
      .output(conversationStopResult),

    clear: oc
      .errors({
        UNAUTHORIZED: errorSchemas.UNAUTHORIZED,
        NOT_FOUND: errorSchemas.NOT_FOUND,
      })
      .input(botGet)
      .output(conversationClearResult),

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
