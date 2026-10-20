import { BACKGROUND_CONTEXT } from '@earendil-works/chord/context';
import { createRegistry, Harness } from '@earendil-works/pi-durable';
import { log } from '@openbots/logger/server';
import { match, P } from 'ts-pattern';
import { makeArtifactService } from '../artifact/artifact.service';
import { makeConversationIndexService } from '../conversation-index/conversation-index.service';
import { makeNotificationService } from '../notification/notification.service';
import { makeQuestionService } from '../question/question.service';
import { makeRoutineService } from '../routine/routine.service';
import { makeTodoService } from '../todo/todo.service';
import { runtimeArtifactToolsExtension } from './runtime-artifact-tools.utils';
import { runtimeQueryNextDeadline } from './runtime-query.next-deadline';
import { runtimeRoutineToolsExtension } from './runtime-routine-tools.utils';
import { runtimeTodoToolsExtension } from './runtime-todo-tools.utils';
import { runtimeToolsExtension } from './runtime-tools.utils';
import { RUNTIME_ALARM_DEBOUNCE_MS } from './runtime.constants';
import type { RuntimeBot, RuntimeServiceDeps, RuntimeSharedDeps } from '../../types/runtime.types';

/** Open one bot's Pi store with its own registry and Harness; shared extensions and the model limiter are reused. */
export async function runtimeBotOpen(shared: RuntimeSharedDeps, botId: string): Promise<RuntimeBot> {
  const storage = await shared.storage.open({ botId });
  const registry = createRegistry();

  for (const extension of shared.extensions) {
    registry.install(extension);
  }

  const harness = await Harness.open(storage, {
    models: shared.models,
    registry,
    env: shared.env,
  }, BACKGROUND_CONTEXT).catch(async (error: unknown) => {
    await storage.close(BACKGROUND_CONTEXT);
    throw error;
  });

  try {
    const artifacts = makeArtifactService({ harness });
    const artifactTools = runtimeArtifactToolsExtension({ artifacts });
    const routines = makeRoutineService({ harness });
    const routineTools = runtimeRoutineToolsExtension({ harness, routines });
    const todos = makeTodoService({ harness });
    const todoTools = runtimeTodoToolsExtension({ harness, todos });
    const readOnlyTools = [...shared.readOnlyTools, ...artifactTools.readOnlyTools, ...routineTools.readOnlyTools, ...todoTools.readOnlyTools];

    // The permission hook stays last, including for custom and MCP tools.
    const permissionExtension = runtimeToolsExtension({
      harness,
      readOnlyTools,
      permissions: shared.permissions,
    });

    for (const extension of [artifactTools.extension, routineTools.extension, todoTools.extension, permissionExtension]) {
      registry.install(extension);
    }

    const deps: RuntimeServiceDeps = {
      botId,
      directory: shared.directory,
      harness,
      questions: makeQuestionService({ harness }),
      routines,
      todos,
      artifacts,
      index: await makeConversationIndexService({ harness }),
      registry,
      models: shared.models,
      readOnlyTools,
      extensions: [...shared.extensions, artifactTools.extension, routineTools.extension, todoTools.extension, permissionExtension],
    };

    const arm = runtimeBotAlarm(shared, deps);
    const unsubscribe = harness.subscribeCommits(arm.schedule);
    arm.schedule();

    return {
      deps,
      notifications: makeNotificationService({ harness, botId }),
      wake: () => {
        harness.resume();
        arm.schedule();
      },
      close: async () => {
        unsubscribe();
        arm.cancel();
        await harness.close(BACKGROUND_CONTEXT);
      },
    };
  } catch (error) {
    await harness.close(BACKGROUND_CONTEXT);
    throw error;
  }
}

/** Debounced alarm arming: after commits, set the host alarm to the store's next saved deadline. */
function runtimeBotAlarm(shared: RuntimeSharedDeps, deps: RuntimeServiceDeps) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let isCancelled = false;

  const arm = async () => {
    const at = await runtimeQueryNextDeadline(deps, BACKGROUND_CONTEXT).catch((error: unknown) => {
      match(isCancelled)
        .with(true, () => undefined)
        .with(false, () => log.error({
          tag: 'runtime-alarm',
          message: 'Cannot read the next deadline.',
          botId: deps.botId,
          error,
        }))
        .exhaustive();
      return null;
    });

    match({ at, isCancelled })
      .with({ isCancelled: true }, () => undefined)
      .with({ at: P.number }, ({ at: value }) => shared.alarm.set({ botId: deps.botId, at: value }))
      .otherwise(() => shared.alarm.clear({ botId: deps.botId }));
  };

  return {
    schedule: () => {
      clearTimeout(timer);
      timer = setTimeout(() => void arm(), RUNTIME_ALARM_DEBOUNCE_MS);
      timer.unref();
    },
    cancel: () => {
      isCancelled = true;
      clearTimeout(timer);
      shared.alarm.clear({ botId: deps.botId });
    },
  };
}
