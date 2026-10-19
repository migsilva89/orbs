import { Type } from '@earendil-works/pi-ai';
import { botCreate, botGet, botSwapModels, botUpdate } from '@openbots/contracts/universal';
import { z } from 'zod';
import type { RuntimeServiceDeps } from './runtime.types';
import type { Models } from '@earendil-works/pi-ai/models';
import type * as UniversalTypes from '@openbots/contracts/universal';

export interface RuntimeBotToolsBots {
  actions: {
    swapModels: (params: UniversalTypes.BotSwapModelsInput) => Promise<UniversalTypes.BotSwapModelsResult>;
    create: (params: UniversalTypes.BotCreateInput) => Promise<UniversalTypes.Bot>;
    update: (params: UniversalTypes.BotUpdateInput) => Promise<UniversalTypes.Bot>;
  };
  queries: {
    catalog: (params: UniversalTypes.BotGetInput) => Promise<UniversalTypes.BotCatalog>;
    get: (params: UniversalTypes.BotGetInput) => Promise<UniversalTypes.Bot>;
  };
}

export interface RuntimeRegisterBotToolsParams {
  bots: RuntimeBotToolsBots;
}

export interface RuntimeBotToolsDeps extends RuntimeRegisterBotToolsParams {
  models: Models;
}

export type RuntimeRegisterBotToolsDeps = Pick<RuntimeServiceDeps, 'registry' | 'extensions' | 'readOnlyTools' | 'models'>;

export const botToolCreate = botCreate.strict();
export const botToolUpdate = botUpdate.strict();
export const botToolGet = botGet.strict();
export const botToolSwapModels = botSwapModels.strict();

export const botToolCreateParameters = Type.Unsafe<z.infer<typeof botToolCreate>>(
  z.toJSONSchema(botToolCreate, { io: 'input' }),
);

export const botToolUpdateParameters = Type.Unsafe<z.infer<typeof botToolUpdate>>(
  z.toJSONSchema(botToolUpdate, { io: 'input' }),
);

export const botToolGetParameters = Type.Unsafe<z.infer<typeof botToolGet>>(
  z.toJSONSchema(botToolGet, { io: 'input' }),
);

export const botToolSwapModelsParameters = Type.Unsafe<z.infer<typeof botToolSwapModels>>(
  z.toJSONSchema(botToolSwapModels, { io: 'input' }),
);
