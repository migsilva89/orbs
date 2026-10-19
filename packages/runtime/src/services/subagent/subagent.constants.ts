import { defineDoc } from '@earendil-works/pi-durable';
import { ENTRY } from '@openbots/contracts/universal';
import type { SubagentAgents, SubagentCall } from '../../types/subagent.types';

export const SUBAGENT = {
  extension: 'openbots.subagents',
  tool: 'bot_subagent',
  stop: 'bot_subagent_stop',
  anchor: 'openbots.subagent-anchor',
  reporter: 'openbots.subagent-reporter',
  agents: 'openbots.subagent-agents',
  call: 'openbots.subagent-call',
  report: ENTRY.subagentReport,
  request: 'openbots.subagent',
  reportRequest: 'openbots.subagent-report',
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
