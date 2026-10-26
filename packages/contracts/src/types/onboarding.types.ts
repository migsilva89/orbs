import { z } from 'zod';
import { botFields } from './bot.types';

export const onboardingStep = z.enum(['welcome', 'model', 'approvals', 'bot', 'done']);

export const onboardingStepParams = z.object({ step: onboardingStep });

export const onboardingSearch = z.object({
  handle: botFields.shape.handle.optional().catch(undefined),
});

export const onboardingState = z.object({
  completedAt: z.number().int().nullable(),
});

export type OnboardingStep = z.infer<typeof onboardingStep>;
export type OnboardingState = z.infer<typeof onboardingState>;
