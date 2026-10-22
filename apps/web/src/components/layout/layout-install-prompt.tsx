import { env } from '@repo/env/client';
import { m } from '@repo/i18n/client';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useIsStandalone } from '@/hooks/use-is-standalone';
import { layoutShowInstallPrompt } from '@/services/layout/layout.client';
import { LAYOUT_INSTALL_DISMISSED_KEY } from '@/services/layout/layout.constants';
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
