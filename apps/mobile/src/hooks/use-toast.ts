import { Errors } from '@repo/errors/universal';
import { use } from 'react';
import { match, P } from 'ts-pattern';
import { toastContext } from '@/context/toast';

export function useToast() {
  return match(use(toastContext))
    .with(P.nonNullable, (toast) => toast)
    .otherwise(() => {
      throw new Errors.INTERNAL_ERROR({ internal: 'Toast provider is missing' });
    });
}
