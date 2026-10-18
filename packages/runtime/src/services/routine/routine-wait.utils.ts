import { awaitWithContext, withCancel } from '@earendil-works/chord/context';
import { match, P } from 'ts-pattern';
import { routineDocument } from './routine.constants';
import type { RoutineTaskRuntime, RoutineWaitState } from '../../types/routine.types';
import type { Context } from '@earendil-works/chord/context';

export async function routineWait(api: RoutineTaskRuntime, routineId: string, checkpoint: RoutineWaitState, context: Context) {
  const child = withCancel(context);
  const watch = await api.watchDoc(routineDocument, api.conversationId, child.context);

  try {
    const changed = new Promise<void>((resolve) => {
      const observe = (revision: number | undefined) => match(revision === checkpoint.revision)
        .with(true, () => undefined)
        .with(false, () => resolve())
        .exhaustive();

      observe(watch?.value?.routines[routineId]?.revision);
      watch?.start(async (value) => {
        observe(value?.routines[routineId]?.revision);
      });
    });

    const waiting = match(checkpoint.until)
      .with(P.number, (until) => Promise.race([changed, api.sleep(until, child.context)]))
      .with(null, () => changed)
      .exhaustive();

    await awaitWithContext(waiting, child.context);
  } finally {
    child.cancel();
    await watch?.stop();
  }
}
