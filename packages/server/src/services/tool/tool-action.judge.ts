import { log, redactSecrets } from '@repo/logger/server';
import { TypeSafeClient } from '@typesafe-ai/sdk';
import { match, P } from 'ts-pattern';
import { TOOL } from './tool.constants';
import { toolPromptsApprovalQuestion, toolPromptsAskFirstQuestion } from './tool.prompts';
import type { ToolJudgeParams, ToolServiceDeps } from '../../types/tool.types';

export async function toolActionJudge({ credentials }: ToolServiceDeps, params: ToolJudgeParams): Promise<boolean> {
  const input = JSON.stringify(params.arguments);

  const key = await credentials.queries.get({ key: TOOL.jevCredential });

  const request = await match({ key, size: input.length })
    .with({ key: P.string, size: P.number.lte(TOOL.judgeInputLimit) }, () => params.getRequest())
    .otherwise(() => '');

  const isEligible = request.length > 0 && request.length <= TOOL.judgeRequestLimit;

  return match({ isEligible, key })
    .with({ isEligible: true, key: P.string }, async ({ key: apiKey }) => {
      try {
        const client = new TypeSafeClient({
          apiKey,
          baseURL: 'https://api.typesafe.ai',
          defaultModel: 'jev-latest',
          logLevel: 'off',
          timeout: TOOL.judgeTimeoutMs,
          retry: { maxRetries: 0 },
        });

        const { answers } = await client.systemOne({
          state: {
            instructions: redactSecrets(params.instructions),
            request: redactSecrets(request),
            call: { tool: params.name, input: redactSecrets(input) },
            rules: {
              allow: params.approvalRules.filter((rule) => rule.behavior === 'allow').map((rule) => redactSecrets(rule.when)),
              askFirst: params.approvalRules.filter((rule) => rule.behavior === 'ask').map((rule) => redactSecrets(rule.when)),
            },
          },
          questions: {
            safe: toolPromptsApprovalQuestion(),
            askFirst: toolPromptsAskFirstQuestion(),
          },
        }, { signal: params.context.abortSignal });

        return answers.safe.noul >= TOOL.judgeThreshold && answers.askFirst.noul <= TOOL.judgeAskThreshold;
      } catch {
        log.warn({
          tag: 'tool',
          message: 'Automatic approval unavailable; requesting owner approval.',
          botId: params.botId,
        });
        return false;
      }
    })
    .otherwise(() => false);
}
