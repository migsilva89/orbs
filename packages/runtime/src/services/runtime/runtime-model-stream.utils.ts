import { createAssistantMessageEventStream } from '@earendil-works/pi-ai/utils/event-stream';
import { isContextOverflow } from '@earendil-works/pi-ai/utils/overflow';
import { isRetryableAssistantError } from '@earendil-works/pi-ai/utils/retry';
import { match, P } from 'ts-pattern';
import type { RuntimeModelRequest } from '../../types/runtime-model.types';
import type * as PiAiTypes from '@earendil-works/pi-ai';
import type { Models, ModelsSimpleStreamOptions } from '@earendil-works/pi-ai/models';
import type { ModelSelection } from '@repo/contracts/universal';

export function runtimeModelStream(models: Models, { route, context, options }: RuntimeModelRequest) {
  const stream = createAssistantMessageEventStream();
  const primary = models.getModel(route.primary.modelProvider, route.primary.modelId);
  const fallback = models.getModel(route.fallback.modelProvider, route.fallback.modelId);
  const first = primary ?? fallback;

  async function request() {
    return match(first)
      .with(P.nonNullable, async (model) => {
        const selection = primary === undefined ? route.fallback : route.primary;
        const events = models.streamSimple(model, context, runtimeModelOptions(selection, model, options));
        let hasOutput = false;

        for await (const event of events) {
          const shouldFallback = event.type === 'error'
            && !hasOutput && !options?.signal?.aborted
            && primary !== undefined && fallback !== undefined
            && (primary.provider !== fallback.provider || primary.id !== fallback.id)
            && !runtimeModelHasOutput(event.error)
            && event.error.usage.totalTokens === 0 && event.error.usage.cost.total === 0
            && runtimeModelCanFallback(event.error);

          await match({ shouldFallback, fallback })
            .with({ shouldFallback: true, fallback: P.nonNullable }, async ({ fallback: backup }) => {
              const response = models.streamSimple(backup, context, runtimeModelOptions(route.fallback, backup, options));

              for await (const next of response) {
                stream.push(next);
              }
            })
            .otherwise(() => stream.push(event));

          hasOutput ||= event.type !== 'error' && event.type !== 'done' && runtimeModelHasOutput(event.partial);
        }
      })
      .otherwise(() => {
        throw new Error('Configured models are unavailable.');
      });
  }

  void request().catch(() => {
    stream.push(runtimeModelFailure({
      api: first?.api ?? 'openai-completions',
      provider: first?.provider ?? route.primary.modelProvider,
      model: first?.id ?? route.primary.modelId,
    }, options));
  });

  return stream;
}

export function runtimeModelFailure(
  model: Pick<PiAiTypes.AssistantMessage, 'api' | 'provider' | 'model'>,
  options?: ModelsSimpleStreamOptions,
): PiAiTypes.AssistantMessageEvent {
  const stopReason = options?.signal?.aborted ? 'aborted' as const : 'error' as const;

  return {
    type: 'error',
    reason: stopReason,
    error: {
      role: 'assistant',
      content: [],
      ...model,
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        totalTokens: 0,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
      },
      stopReason,
      errorMessage: 'Model request failed.',
      timestamp: Date.now(),
    },
  };
}

function runtimeModelOptions(selection: ModelSelection, model: PiAiTypes.Model<PiAiTypes.Api>, options?: ModelsSimpleStreamOptions) {
  return {
    ...options,
    reasoning: match(selection.thinkingLevel).with('off', () => undefined).otherwise((level) => level),
    maxTokens: match(options?.maxTokens).with(P.number, (tokens) => Math.min(tokens, model.maxTokens)).otherwise(() => undefined),
  };
}

function runtimeModelCanFallback(message: PiAiTypes.AssistantMessage) {
  return message.stopReason === 'error' && !isContextOverflow(message)
    && (isRetryableAssistantError(message)
      || /\b(401|403)\b|not configured|no (?:api key|credentials)|unauthorized|authentication|\bauth\b|oauth|token.*(?:expired|invalid)|insufficient_quota|quota exceeded|billing|usage limit/i.test(message.errorMessage ?? ''));
}

function runtimeModelHasOutput(message: PiAiTypes.AssistantMessage) {
  return message.content.some((block) => match(block)
    .with({ type: 'text' }, ({ text }) => text.length > 0)
    .with({ type: 'thinking' }, ({ thinking }) => thinking.length > 0)
    .with({ type: 'toolCall' }, () => true)
    .exhaustive());
}
