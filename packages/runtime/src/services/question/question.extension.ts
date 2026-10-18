import { Type } from '@earendil-works/pi-ai';
import { defineExtension, defineTool } from '@earendil-works/pi-durable';
import { QUESTION as QUESTION_BOUNDS } from '@openbots/contracts/universal';
import * as m from '@openbots/i18n/messages';
import { questionActionAsk } from './question-action.ask';
import { QUESTION } from './question.constants';

const ask = defineTool({
  name: QUESTION.tool,
  description: m.ui_tool_ask_description(),
  parameters: Type.Object({
    text: Type.String({
      minLength: 1,
      maxLength: QUESTION_BOUNDS.maxText,
      pattern: '\\S',
    }),
    choices: Type.Optional(Type.Array(Type.String({
      minLength: 1,
      maxLength: QUESTION_BOUNDS.maxChoice,
      pattern: '\\S',
    }), {
      maxItems: QUESTION_BOUNDS.maxChoices,
    })),
  }),
  replay: 'safe',
  execute: (params, api, context) => questionActionAsk(params, api, context),
});

export function questionExtension() {
  return {
    extension: defineExtension({
      name: QUESTION.extension,
      tools: [ask],
    }),
    readOnlyTools: [ask],
  };
}
