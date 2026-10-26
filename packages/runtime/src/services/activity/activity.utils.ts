import { ATTACHMENT, ENTRY, REACTION, REPLY, toolCallJson, toolCallText } from '@repo/contracts/universal';
import { match, P } from 'ts-pattern';
import { activityStoredTrace } from '../../types/activity.types';
import { questionDocument } from '../question/question.constants';
import { ROUTINE } from '../routine/routine.constants';
import { RUNTIME_REACTION_TASK } from '../runtime/runtime-reaction.constants';
import { runtimeToolApproval } from '../runtime/runtime.constants';
import { SUBAGENT } from '../subagent/subagent.constants';
import { ACTIVITY } from './activity.constants';
import type * as ActivityTypes from '../../types/activity.types';
import type { EntryId, EntryRecord, TaskId } from '@earendil-works/pi-durable';
import type * as ContractTypes from '@repo/contracts/universal';

async function activityFetchPage(
  params: ActivityTypes.ActivityFetchParams,
  found: ActivityTypes.ActivityTrace[],
  cursor: string | undefined,
  pages: number,
): Promise<ActivityTypes.ActivityFetchResult> {
  const page = await params.telemetry.findTraces({
    ...params.query,
    limit: ACTIVITY.tracePage,
    cursor,
  });

  const traces = [...found, ...page.traces.map((trace) => activityStoredTrace.parse(trace))];
  const canContinue = page.cursor !== undefined && pages + 1 < ACTIVITY.maxTracePages && !params.isEnough(traces);

  return match(canContinue)
    .with(true, () => activityFetchPage(params, traces, page.cursor, pages + 1))
    .with(false, () => ({ traces, hasMore: page.cursor !== undefined }))
    .exhaustive();
}

export function activityFetch(params: ActivityTypes.ActivityFetchParams) {
  return activityFetchPage(params, [], undefined, 0);
}

export async function activityLiveTasks(
  { harness }: ActivityTypes.ActivityServiceDeps,
  context: ActivityTypes.ActivityContextParams['context'],
): Promise<ActivityTypes.ActivityLiveTask[]> {
  const graph = await harness.taskGraph(context);

  try {
    return Object.values(graph.value.tasks)
      .filter((task) => !task.abortRequested)
      .map((task) => ({
        id: task.id,
        kind: task.kind,
        conversationId: task.conversationId,
        status: task.state.status,
        tool: null,
        wait: task.kind === ACTIVITY.task.tool && task.conversations.length > 0 ? 'subagent' as const : null,
      }));
  } finally {
    graph.dispose();
  }
}

export async function activityLiveWaits(
  { harness }: ActivityTypes.ActivityServiceDeps,
  tasks: readonly ActivityTypes.ActivityLiveTask[],
  context: ActivityTypes.ActivityContextParams['context'],
): Promise<ActivityTypes.ActivityLiveTask[]> {
  return Promise.all(tasks.map(async (task) => match(task.kind)
    .with(ACTIVITY.task.tool, async () => {
      // SAFETY: the ID comes from this store's live task graph and is only used as a document lookup key.
      const taskId = task.id as TaskId;

      const [approval, question] = await Promise.all([
        harness.snapshot(runtimeToolApproval, taskId, context),
        harness.snapshot(questionDocument, taskId, context),
      ]);

      const wait = match({ approval: approval?.approval?.status, question: question?.question?.status })
        .with({ approval: 'pending' }, () => 'approval' as const)
        .with({ question: 'pending' }, () => 'question' as const)
        .otherwise(() => task.wait);

      return { ...task, tool: approval?.approval?.toolName ?? null, wait };
    })
    .otherwise(async () => task)));
}

function activityTraceInfo(trace: ActivityTypes.ActivityTrace): ActivityTypes.ActivityTraceInfo {
  const root = trace.spans.find((span) => span.parentId === undefined && span.name === ACTIVITY.span.submit) ?? trace.spans[0];
  const entry = root.events.find((event) => event.name === ACTIVITY.event.entry);

  return {
    trace,
    root,
    conversationId: root.name === ACTIVITY.span.submit ? root.attributes['conversation.id'] ?? null : null,
    entryId: entry?.attributes['entry.id'] ?? null,
    entryKind: entry?.attributes['entry.kind'] ?? null,
    linkedTask: null,
  };
}

export function activityGroups(traces: readonly ActivityTypes.ActivityTrace[], conversationId: number) {
  const infos = traces.filter((trace) => trace.spans.length > 0).map(activityTraceInfo);
  const owners = new Map(infos.flatMap((info) => info.trace.spans.map((span) => [span.id, { info, span }] as const)));
  const traceInfos = new Map(infos.map((info) => [info.trace.traceId, info]));
  const parents = new Map<string, ActivityTypes.ActivityTraceInfo>();
  const dispatches: ActivityTypes.ActivityDispatch[] = [];

  for (const info of infos) {
    for (const link of info.root.links) {
      const span = owners.get(link.spanId);
      const owner = span ?? match(traceInfos.get(link.traceId)).with(P.nonNullable, (found) => ({ info: found })).otherwise(() => undefined);
      const task = span?.span.attributes['task.name'] ?? null;

      match({
        owner,
        isOwn: owner?.info === info,
        isChild: owner?.info.conversationId !== info.conversationId,
        isReport: task === SUBAGENT.reporter,
      })
        .with({ owner: P.nullish }, { isOwn: true }, () => undefined)
        .with({ owner: P.nonNullable, isChild: true }, ({ owner: found }) => {
          parents.set(info.trace.traceId, found.info);
          dispatches.push({ parent: found.info, child: info });
        })
        .with({ owner: P.nonNullable, isReport: true }, ({ owner: found }) => {
          parents.set(info.trace.traceId, found.info);
        })
        .otherwise(() => {
          info.linkedTask = task ?? info.linkedTask;
        });
    }
  }

  const activityRootOf = (info: ActivityTypes.ActivityTraceInfo) => {
    const seen = new Set<string>();
    let current = info;

    while (parents.has(current.trace.traceId) && !seen.has(current.trace.traceId)) {
      seen.add(current.trace.traceId);
      current = parents.get(current.trace.traceId) ?? current;
    }

    return current;
  };

  const groups = new Map<string, ActivityTypes.ActivityGroup>();

  for (const info of infos) {
    const root = activityRootOf(info);

    if (root.conversationId === conversationId) {
      const group = groups.get(root.trace.traceId) ?? { root, traces: [], dispatches: [] };
      group.traces.push(info);
      groups.set(root.trace.traceId, group);
    }
  }

  for (const dispatch of dispatches) {
    groups.get(activityRootOf(dispatch.child).trace.traceId)?.dispatches.push(dispatch);
  }

  return [...groups.values()].sort((a, b) => b.root.root.startedMs - a.root.root.startedMs);
}

function activityTrigger(info: ActivityTypes.ActivityTraceInfo): ContractTypes.ActivityTrigger {
  return match({ kind: info.entryKind, task: info.linkedTask })
    .with({ task: ROUTINE.task }, () => 'routine' as const)
    .with({ task: RUNTIME_REACTION_TASK }, { kind: REACTION.entryKind }, () => 'reaction' as const)
    .with({ kind: ENTRY.subagentReport }, () => 'subagent' as const)
    .with({ kind: P.union(ENTRY.peerMessage, ENTRY.peerReply, ENTRY.ownerNote) }, () => 'peer' as const)
    .with({ kind: P.union(ENTRY.user, ATTACHMENT.entryKind, REPLY.entryKind) }, () => 'message' as const)
    .otherwise(() => 'other' as const);
}

function activityTitle(entry: EntryRecord | undefined) {
  const text = match(entry?.model?.[0])
    .with({ role: 'user', content: P.string }, ({ content }) => content)
    .with({ role: 'user', content: P.array() }, ({ content }) => content.flatMap((part) => match(part)
      .with({ type: 'text' }, ({ text: value }) => [value])
      .otherwise(() => [])).join(' '))
    .otherwise(() => '');

  const title = text.replace(/\s+/g, ' ').trim();

  return match(title)
    .with('', () => null)
    .when((value) => value.length > ACTIVITY.titleChars, (value) => `${value.slice(0, ACTIVITY.titleChars).trimEnd()}…`)
    .otherwise((value) => value);
}

export async function activityEntryTitle(
  { harness }: ActivityTypes.ActivityServiceDeps,
  info: ActivityTypes.ActivityTraceInfo,
  context: ActivityTypes.ActivityContextParams['context'],
) {
  return match(info.entryId)
    .with(null, () => null)
    .otherwise(async (id) => {
      // SAFETY: the ID comes from this store's own committed-entry telemetry event and is only used as a lookup key.
      const entryId = id as EntryId;
      return activityTitle(await harness.commit((tx) => tx.entry(entryId), context));
    });
}

export async function activityToolInputs(
  { harness }: ActivityTypes.ActivityServiceDeps,
  group: ActivityTypes.ActivityGroup,
  context: ActivityTypes.ActivityContextParams['context'],
) {
  const entryIds = [...new Set(group.traces.flatMap((info) => info.trace.spans.flatMap((span) => span.events
    .filter((event) => event.name === ACTIVITY.event.entry && event.attributes['entry.kind'] === ENTRY.assistant)
    .flatMap((event) => event.attributes['entry.id'] ?? []))))].slice(0, ACTIVITY.maxInputEntries);

  const entries = await harness.commit((tx) => Promise.all(entryIds.map((id) => {
    // SAFETY: the ID comes from this store's own committed-entry telemetry event and is only used as a lookup key.
    const entryId = id as EntryId;
    return tx.entry(entryId);
  })), context);

  const calls = entries.flatMap((entry) => {
    const message = entry?.model?.[0];
    return message?.role === 'assistant' ? message.content : [];
  }).flatMap((part) => (part.type === 'toolCall' ? [part] : []));

  return new Map(calls.map((call) => [call.id, Object.fromEntries(Object.entries(toolCallJson.safeParse(call.arguments).data ?? {})
    .flatMap(([key, value]) => {
      const text = toolCallText.safeParse(value);
      return text.success ? [[key, text.data.slice(0, ACTIVITY.inputChars)] as const] : [];
    }))] as const));
}

export function activityNames(agents: readonly (Record<string, { conversationId: number }> | undefined)[]) {
  return new Map(agents.flatMap((record) => Object.entries(record ?? {}).map(([name, agent]) => [agent.conversationId, name] as const)));
}

export function activityIsLive(group: ActivityTypes.ActivityGroup, isNewest: boolean, tasks: readonly ActivityTypes.ActivityLiveTask[]) {
  const main = group.root.conversationId;
  const lanes = new Set(group.traces.map((info) => info.conversationId));
  const working = tasks.filter((task) => task.kind === ACTIVITY.task.generation || task.kind === ACTIVITY.task.tool);

  return working.some((task) => (task.conversationId === main ? isNewest : lanes.has(task.conversationId)));
}

function activitySpanBar(
  span: ActivityTypes.ActivitySpanRecord,
  agentId: string,
  origin: number,
  inputs: ActivityTypes.ActivityBuildParams['inputs'],
): ContractTypes.ActivitySpan[] {
  const attributes = span.attributes;

  const base = {
    id: span.id,
    agentId,
    start: Math.max(0, (span.startedMs - origin) / 1000),
    end: Math.max(0, (span.endedMs - origin) / 1000),
    isFailed: span.status.status === 'error',
    detail: span.status.error?.message ?? null,
    input: null,
  };

  return match(span)
    .with({ name: ACTIVITY.span.request }, () => [{
      ...base,
      kind: 'thinking' as const,
      tool: null,
      calls: span.events.filter((event) => event.name === ACTIVITY.event.block).flatMap((event) => event.attributes.tool ?? []),
      stop: attributes.stop ?? null,
      tokens: (attributes['usage.input'] ?? 0) + (attributes['usage.output'] ?? 0) + (attributes['usage.cache_read'] ?? 0) + (attributes['usage.cache_write'] ?? 0),
      cost: attributes['cost.total'] ?? null,
      isRetry: false,
    }])
    .with({ name: ACTIVITY.span.phase, attributes: { 'task.name': ACTIVITY.task.tool } }, () => [{
      ...base,
      kind: attributes['tool.name'] === SUBAGENT.tool ? 'waiting' as const : 'tool' as const,
      tool: attributes['tool.name'] ?? null,
      calls: [],
      stop: attributes.outcome ?? null,
      tokens: null,
      cost: null,
      isRetry: (attributes.attempt ?? 1) > 1,
      input: inputs.get(attributes['tool.call_id'] ?? '') ?? null,
    }])
    .otherwise(() => []);
}

function activityLiveBar(task: ActivityTypes.ActivityLiveTask, bars: readonly ContractTypes.ActivitySpan[], laneStart: number): ContractTypes.ActivitySpan[] {
  const agentId = String(task.conversationId);
  const start = Math.max(laneStart, ...bars.filter((bar) => bar.agentId === agentId).map((bar) => bar.end ?? bar.start));

  const kind = match(task)
    .with({ kind: ACTIVITY.task.generation, status: 'running' }, () => 'thinking' as const)
    .with({ kind: ACTIVITY.task.tool, wait: P.nonNullable }, () => 'waiting' as const)
    .with({ kind: ACTIVITY.task.tool, status: P.union('running', 'pending') }, () => 'tool' as const)
    .with({ kind: ACTIVITY.task.tool, status: 'waiting' }, () => 'waiting' as const)
    .otherwise(() => null);

  return match(kind)
    .with(P.nonNullable, (value) => [{
      id: `live:${task.id}`,
      agentId,
      kind: value,
      start,
      end: null,
      tool: task.tool,
      calls: [],
      stop: task.wait,
      tokens: null,
      cost: null,
      isFailed: false,
      isRetry: false,
      detail: null,
      input: null,
    }])
    .otherwise(() => []);
}

function activityHandoffs(group: ActivityTypes.ActivityGroup, origin: number, main: number): ContractTypes.ActivityHandoff[] {
  const activityLane = (info: ActivityTypes.ActivityTraceInfo) => String(info.conversationId ?? main);

  return group.dispatches.flatMap((dispatch) => {
    const from = activityLane(dispatch.parent);
    const to = activityLane(dispatch.child);

    const done = dispatch.child.trace.spans.flatMap((span) => span.events
      .filter((event) => event.name === ACTIVITY.event.submission)
      .map((event) => span.startedMs + event.timeMs));

    const result = match(done.length)
      .with(0, () => [])
      .otherwise(() => [{
        from: to,
        to: from,
        at: Math.max(0, (Math.max(...done) - origin) / 1000),
        kind: 'result' as const,
      }]);

    const dispatchAt = Math.max(0, (dispatch.child.root.startedMs - origin) / 1000);

    return [{
      from,
      to,
      at: dispatchAt,
      kind: 'dispatch' as const,
    }, ...result].filter((handoff) => handoff.from !== handoff.to);
  });
}

export function activityRunBuild({ group, title, names, liveTasks, inputs, isLive }: ActivityTypes.ActivityBuildParams): ContractTypes.ActivityRun {
  const main = group.root.conversationId ?? 0;
  const origin = Math.min(...group.traces.map((info) => info.root.startedMs));
  const ordered = [...group.traces].sort((a, b) => a.root.startedMs - b.root.startedMs);
  const lanes = [...new Set([main, ...ordered.flatMap((info) => (info.conversationId === null ? [] : [info.conversationId]))])];
  const laneStarts = new Map(ordered.map((info) => [info.conversationId ?? main, Math.max(0, (info.root.startedMs - origin) / 1000)] as const).reverse());
  const settled = ordered.flatMap((info) => info.trace.spans.flatMap((span) => activitySpanBar(span, String(info.conversationId ?? main), origin, inputs)));

  const live = match(isLive)
    .with(true, () => liveTasks
      .filter((task) => lanes.includes(task.conversationId))
      .flatMap((task) => activityLiveBar(task, settled, laneStarts.get(task.conversationId) ?? 0)))
    .with(false, () => [])
    .exhaustive();

  const models = new Map(ordered.flatMap((info) => info.trace.spans.flatMap((span) => match(span)
    .with({ name: ACTIVITY.span.request, attributes: { model: P.string } }, ({ attributes }) => [[info.conversationId ?? main, attributes.model] as const])
    .otherwise(() => []))));

  const allSpans = ordered.flatMap((info) => info.trace.spans);
  const lastEnd = Math.max(0, ...allSpans.map((span) => (span.endedMs - origin) / 1000));
  const elapsed = match(isLive).with(true, () => Math.max(lastEnd, (Date.now() - origin) / 1000)).with(false, () => lastEnd).exhaustive();

  return {
    id: group.root.trace.traceId,
    trigger: activityTrigger(group.root),
    title,
    startedAt: Math.round(origin),
    durationMs: Math.round(elapsed * 1000),
    agentCount: lanes.length,
    toolCallCount: settled.filter((span) => span.kind !== 'thinking').length,
    tokens: settled.reduce((sum, span) => sum + (span.tokens ?? 0), 0),
    cost: settled.reduce((sum, span) => sum + (span.cost ?? 0), 0),
    isFailed: settled.some((span) => span.isFailed) || allSpans.some((span) => span.name === ACTIVITY.span.phase && span.status.status === 'error'),
    isLive,
    agents: lanes.map((conversationId) => ({
      id: String(conversationId),
      conversationId,
      name: names.get(conversationId) ?? null,
      model: models.get(conversationId) ?? null,
      isMain: conversationId === main,
    })),
    spans: [...settled, ...live],
    handoffs: activityHandoffs(group, origin, main),
  };
}
