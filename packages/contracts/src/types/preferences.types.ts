import { z } from 'zod';

export const preferencesEnterAction = z.enum(['send', 'newline']);

export const preferencesWhenBusy = z.enum(['followUp', 'steer', 'interrupt']);

/** Device-local composer preferences; unknown or missing values fall back to defaults. */
export const preferences = z.object({
  enterKey: z.object({
    desktop: preferencesEnterAction.catch('send'),
    mobile: preferencesEnterAction.catch('newline'),
  }).catch({ desktop: 'send', mobile: 'newline' }),
  whenBusy: preferencesWhenBusy.catch('followUp'),
});

export const preferencesStored = z.string().transform((text, context) => {
  try {
    return JSON.parse(text) as z.input<typeof preferences>;
  } catch {
    context.addIssue({ code: 'custom', message: 'preferences_invalid' });
    return z.NEVER;
  }
}).pipe(preferences);

export type Preferences = z.infer<typeof preferences>;
