import { Errors } from '@openbots/errors/universal';
import { use } from 'react';
import { match, P } from 'ts-pattern';
import { appearanceContext } from '@/context/appearance';

export function useAppearance() {
  return match(use(appearanceContext))
    .with(P.nonNullable, (appearance) => appearance)
    .otherwise(() => {
      throw new Errors.INTERNAL_ERROR({ internal: 'Appearance provider is missing' });
    });
}
