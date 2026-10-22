import { defineExtension, section } from '@earendil-works/pi-durable';
import { runtimeBot } from './runtime.constants';

export const runtimeSkills = defineExtension({
  name: 'bots.skills',
  sections: [section('skills', async (input, context) => {
    const bot = await input.read.snapshot(runtimeBot, input.conversationId, context);
    return bot?.skillsPrompt;
  }, { tag: false })],
});
