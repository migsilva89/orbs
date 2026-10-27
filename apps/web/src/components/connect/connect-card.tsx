import { connectionLostMessage } from '@repo/client/client';
import { env } from '@repo/env/client';
import { m } from '@repo/i18n/client';
import { Alert, AlertDescription } from '@repo/ui/alert';
import * as Card from '@repo/ui/card';
import { ConnectFriends } from '@repo/ui/connect/connect-friends';
import { LayoutBrand } from '@repo/ui/layout/layout-brand';
import { useSearch } from '@tanstack/react-router';
import BrandsLogo from '~icons/brands/logo';
import IconLock from '~icons/lucide/lock';
import { ConnectForm } from './connect-form';

export function ConnectCard() {
  const { reason } = useSearch({ from: '/connect' });

  return (
    <div className="flex-center min-h-svh flex-col bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Card.Card className="overflow-hidden">
          <Card.CardContent className="grid p-0 md:min-h-120 md:grid-cols-2">
            <div className="w-full p-6 md:p-8">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-4 flex flex-col items-center gap-2">
                  <BrandsLogo aria-hidden="true" className="size-10 text-black dark:text-white" />
                  <LayoutBrand size="lg" />
                </div>
                <h1 className="text-xl font-semibold">{m.connect_title()}</h1>
                <p className="text-xs text-balance text-muted-foreground">{m.connect_description({ name: env.VITE_APP_NAME })}</p>
              </div>
              {reason ? (
                <Alert className="mx-auto mb-5 max-w-68">
                  <AlertDescription>{connectionLostMessage(reason)}</AlertDescription>
                </Alert>
              ) : null}
              <ConnectForm />
            </div>
            <ConnectFriends />
          </Card.CardContent>
        </Card.Card>
        <p className="mx-auto mt-4 max-w-full text-center text-xxs leading-none text-muted-foreground md:truncate">
          <IconLock className="mr-1 inline size-2.5 align-[-1px] text-muted-foreground" />
          <span className="md:truncate">{m.connect_privacy_proof({ name: env.VITE_APP_NAME })}</span>
        </p>
      </div>
    </div>
  );
}
