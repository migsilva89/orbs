import { createAssistantMessageEventStream } from '@earendil-works/pi-ai/utils/event-stream';
import { match, P } from 'ts-pattern';
import { runtimeModelStreamFailure } from './runtime-model-stream.utils';
import type * as PiAiTypes from '@earendil-works/pi-ai';
import type { Models } from '@earendil-works/pi-ai/models';

function runtimeModelTraceResult(span: NonNullable<Parameters<Models['streamSimple']>[2]>['telemetry'], message: PiAiTypes.AssistantMessage) {
  span?.setAttributes({
    stop: message.stopReason,
    'usage.input': message.usage.input,
    'usage.output': message.usage.output,
    'usage.cache_read': message.usage.cacheRead,
    'usage.cache_write': message.usage.cacheWrite,
    'cost.total': message.usage.cost.total,
  });

  match(message.stopReason)
    .with('error', () => span?.setStatus({ status: 'error', error: { name: 'provider_error', message: message.errorMessage?.slice(0, 500) ?? '' } }))
    .otherwise(() => undefined);
}

export function runtimeModelTrace(stream: Models['streamSimple']): Models['streamSimple'] {
  return (model, context, options) => match(options?.telemetry)
    .with(P.nullish, () => stream(model, context, options))
    .otherwise((parent) => {
      const output = createAssistantMessageEventStream();

      const runtimeModelTraceRun = () => parent.startSpan({
        name: 'pi.ai.request',
        attributes: { provider: model.provider, api: model.api, model: model.id },
      }, async (span) => {
        for await (const event of stream(model, context, { ...options, telemetry: span })) {
          match(event)
            .with({ type: 'toolcall_end' }, ({ contentIndex, toolCall }) => span.addEvent('pi.ai.block', {
              type: 'tool_call',
              index: contentIndex,
              chars: 0,
              tool: toolCall.name,
            }))
            .with({ type: 'text_end' }, ({ contentIndex, content }) => span.addEvent('pi.ai.block', {
              type: 'text',
              index: contentIndex,
              chars: content.length,
            }))
            .with({ type: 'done' }, ({ message }) => runtimeModelTraceResult(span, message))
            .with({ type: 'error' }, ({ error }) => runtimeModelTraceResult(span, error))
            .otherwise(() => undefined);

          output.push(event);
        }
      });

      void runtimeModelTraceRun().catch(() => {
        output.push(runtimeModelStreamFailure({
          api: model.api,
          provider: model.provider,
          model: model.id,
        }, options));
      });

      return output;
    });
}
