import { Type } from '@earendil-works/pi-ai';
import { defineExtension, defineTool } from '@earendil-works/pi-durable';
import { QUESTION as QUESTION_BOUNDS } from '@repo/contracts/universal';
import * as m from '@repo/i18n/messages';
import { questionActionAsk } from './question-action.ask';
import { QUESTION } from './question.constants';

const ask = defineTool({
  name: QUESTION.tool,
  description: m.ui_tool_bot_question_description(),
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
    isMultiSelect: Type.Optional(Type.Boolean({ description: 'Let the owner pick more than one choice.' })),
  }),
  replay: 'safe',
  execute: (input, api, context) => questionActionAsk({
    input,
    api,
    context,
  }),
});

const askSecret = defineTool({
  name: QUESTION.secretTool,
  description: m.ui_tool_bot_secret_description(),
  parameters: Type.Object({
    name: Type.String({ description: m.ui_tool_bot_secret_name_description() }),
    hosts: Type.Array(Type.String(), { description: m.ui_tool_bot_secret_hosts_description() }),
  }),
  replay: 'safe',
  execute: ({ name, hosts }, api, context) => questionActionAsk({
    input: { text: m.ui_tool_bot_secret_question({ name }), secret: { name, hosts } },
    api,
    context,
  }),
});

export function makeQuestionExtensionService() {
  return {
    extension: defineExtension({
      name: QUESTION.extension,
      tools: [ask, askSecret],
    }),
    readOnlyTools: [ask, askSecret],
  };
}

export type QuestionExtensionService = ReturnType<typeof makeQuestionExtensionService>;
