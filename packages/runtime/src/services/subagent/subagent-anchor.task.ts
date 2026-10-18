import { defineTask } from '@earendil-works/pi-durable';
import { SUBAGENT } from './subagent.constants';

export const subagentAnchor = defineTask<null, { phase: 'done' }, null>({
  name: SUBAGENT.anchor,
  version: 1,
  initial: () => ({ phase: 'done' }),
  phases: {
    done: (_anchor, runtime, context) => runtime.commit(
      () => ({ status: 'terminal', outcome: { status: 'completed', result: null } }),
      context,
    ),
  },
  abort: (_anchor, runtime, context) => runtime.commit(
    () => ({ status: 'terminal', outcome: { status: 'aborted' } }),
    context,
  ),
});
