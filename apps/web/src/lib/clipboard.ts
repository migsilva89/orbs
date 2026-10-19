import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';

export async function clipboardCopy(text: string): Promise<void> {
  await match(navigator.clipboard)
    .with(P.nullish, () => {
      const focused = document.activeElement;
      const input = document.createElement('textarea');
      input.value = text;
      input.readOnly = true;
      input.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
      (focused?.closest('[role="dialog"]') ?? document.body).append(input);

      try {
        input.focus({ preventScroll: true });
        input.select();
        match(document.execCommand('copy'))
          .with(false, () => {
            throw new Errors.INTERNAL_ERROR({ internal: 'Browser rejected clipboard copy' });
          })
          .with(true, () => undefined)
          .exhaustive();
      } finally {
        input.remove();
        match(focused)
          .with(P.instanceOf(HTMLElement), (element) => element.focus({ preventScroll: true }))
          .otherwise(() => undefined);
      }
    })
    .otherwise((clipboard) => clipboard.writeText(text));
}
