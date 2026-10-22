import { defineDoc } from '@earendil-works/pi-durable';
import { ENTRY } from '@repo/contracts/universal';
import type { SubagentAgents, SubagentCall } from '../../types/subagent.types';

export const SUBAGENT = {
  extension: 'bots.subagents',
  tool: 'bot_subagent',
  stop: 'bot_subagent_stop',
  anchor: 'bots.subagent-anchor',
  reporter: 'bots.subagent-reporter',
  agents: 'bots.subagent-agents',
  call: 'bots.subagent-call',
  report: ENTRY.subagentReport,
  request: 'bots.subagent',
  reportRequest: 'bots.subagent-report',
  maxBackgroundAgents: 8,
} as const;

export const subagentAgents = defineDoc<SubagentAgents>({
  kind: SUBAGENT.agents,
  version: 1,
  scope: 'conversation',
  history: 'latest',
  fork: 'initial',
  initial: () => ({ agents: {} }),
});

export const subagentCall = defineDoc<SubagentCall>({
  kind: SUBAGENT.call,
  version: 1,
  scope: 'task',
  initial: () => ({ text: null, name: null, conversationId: null }),
});
