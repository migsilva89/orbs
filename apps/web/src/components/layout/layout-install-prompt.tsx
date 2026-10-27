import { useIsStandalone } from '@repo/client/web';
import { env } from '@repo/env/client';
import { m } from '@repo/i18n/client';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert';
import { Button } from '@repo/ui/button';
import { LAYOUT_INSTALL_DISMISSED_KEY } from '@repo/ui/layout.constants';
import { useState } from 'react';
import { layoutShowInstallPrompt } from '@/services/layout/layout.client';
import IconShare from '~icons/lucide/share';
import IconX from '~icons/lucide/x';

export function LayoutInstallPrompt() {
  const standalone = useIsStandalone();
  const [visible, setVisible] = useState(layoutShowInstallPrompt);

  if (!visible || standalone) {
    return null;
  }

  return (
    <aside aria-label={m.layout_install_title({ name: env.VITE_APP_NAME })} className="fixed inset-x-4 top-4 z-40 mx-auto max-w-sm">
      <Alert role="note">
        <IconShare />
        <AlertTitle className="mr-8">{m.layout_install_title({ name: env.VITE_APP_NAME })}</AlertTitle>
        <AlertDescription className="mr-8">{m.layout_install_instructions()}</AlertDescription>
        <Button
          aria-label={m.layout_install_dismiss()}
          className="absolute top-2 right-2"
          size="icon-sm"
          title={m.layout_install_dismiss()}
          variant="ghost"
          onClick={() => {
            try {
              localStorage.setItem(LAYOUT_INSTALL_DISMISSED_KEY, 'true');
            } catch {
              setVisible(false);
              return;
            }
            setVisible(false);
          }}
        >
          <IconX />
        </Button>
      </Alert>
    </aside>
  );
}
