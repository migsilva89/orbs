import type { CSSProperties, ReactNode } from 'react';

export type AgentTimelineSpanKind = 'thinking' | 'tool' | 'waiting';

export interface AgentTimelineAgent {
  id: string
  name: string
  model?: string
  mark?: ReactNode
}

export interface AgentTimelineTool {
  name: string
  mark?: ReactNode
}

export interface AgentTimelineSpan {
  id?: string
  agentId: string
  kind: AgentTimelineSpanKind
  start: number
  end?: number
  label: string
  detail?: string
  tool?: AgentTimelineTool
  tokens?: number
  cost?: number
  status?: 'ok' | 'failed'
  retry?: boolean
}

export interface AgentTimelineHandoff {
  from: string
  to: string
  at: number
  label?: string
}

export interface AgentTimelineRun {
  title?: string
  agents: AgentTimelineAgent[]
  spans: AgentTimelineSpan[]
  handoffs?: AgentTimelineHandoff[]
  duration?: number
  startedAt?: number
}

export interface AgentTimelineLane extends AgentTimelineAgent {
  index: number
  color: string
}

export interface AgentTimelineBar extends Omit<AgentTimelineSpan, 'id' | 'end'> {
  id: string
  index: number
  row: number
  end: number
  isOpen: boolean
  spanCost: number
}

export interface AgentTimelineConnector {
  id: string
  handoff: AgentTimelineHandoff
  from: number
  to: number
  at: number
  shape: 'out' | 'in' | 'line'
  x0: number
  x1: number
  isUp: boolean
  color: string
  sourceSpan?: string
  targetSpan?: string
}

export interface AgentTimelineConnectorParams {
  handoff: AgentTimelineHandoff
  index: number
  from: number
  to: number
  byRow: AgentTimelineBar[][]
  agents: AgentTimelineLane[]
}

export interface AgentTimelineModel {
  agents: AgentTimelineLane[]
  spans: AgentTimelineBar[]
  byRow: AgentTimelineBar[][]
  connectors: AgentTimelineConnector[]
  duration: number
  totals: {
    tokens: number
    cost: number
    speedup: number
  }
}

export interface AgentTimelinePath {
  spans: Set<string>
  links: Set<string>
}

export type AgentTimelineStyle = CSSProperties & Record<`--${string}`, number | string>;
