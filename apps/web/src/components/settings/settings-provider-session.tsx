import { m } from '@openbots/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { match } from 'ts-pattern';
import { Button } from '@/components/ui/button';
import { FormErrors } from '@/components/ui/forms/form';
import { Input } from '@/components/ui/input';
import { rpc } from '@/services/rpc/rpc.client';
import { SETTINGS } from '@/services/settings/settings.constants';
import type { ProviderSession } from '@openbots/contracts/universal';

interface SettingsProviderSessionProps {
  session: ProviderSession
  onClose: () => void
}

export function SettingsProviderSession({ session: started, onClose }: SettingsProviderSessionProps) {
  const queryClient = useQueryClient();
  const [answer, setAnswer] = useState('');

  const { data: session } = useQuery({
    ...rpc.providers.session.queryOptions({ input: { id: started.id } }),
    initialData: started,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? SETTINGS.providerPollMs : false),
  });

  const complete = useMutation(rpc.providers.complete.mutationOptions({ onSuccess: () => setAnswer('') }));
  const cancel = useMutation(rpc.providers.cancel.mutationOptions());
  const { prompt } = session;
  const isPending = session.status === 'pending';

  useEffect(() => {
    if (!isPending) {
      void queryClient.invalidateQueries({ queryKey: rpc.providers.list.key() });
    }
  }, [isPending, queryClient]);

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
      {match(session.status)
        .with('completed', () => <output>{m.settings_providers_login_completed()}</output>)
        .with('cancelled', () => <output>{m.settings_providers_login_cancelled()}</output>)
        .with('pending', 'failed', () => null)
        .exhaustive()}
      {isPending ? session.events.map((event, index) => match(event)
        .with({ type: 'auth_url' }, ({ url, instructions }) => (
          <p key={index}>
            {instructions ?? m.settings_providers_open_link()}
            {' '}
            <a
              className="underline"
              href={url}
              rel="noreferrer"
              target="_blank"
            >{m.settings_providers_link()}</a>
          </p>
        ))
        .with({ type: 'device_code' }, ({ userCode, verificationUri }) => (
          <p key={index}>
            {m.settings_providers_device_code({ code: userCode })}
            {' '}
            <a
              className="underline"
              href={verificationUri}
              rel="noreferrer"
              target="_blank"
            >{verificationUri}</a>
          </p>
        ))
        .with({ type: 'info' }, ({ message }) => <p className="text-muted-foreground" key={index}>{message}</p>)
        .with({ type: 'progress' }, ({ message }) => <p className="text-muted-foreground" key={index}>{message}</p>)
        .exhaustive()) : null}
      {isPending && prompt?.type === 'select' ? (
        <div className="flex flex-col gap-1">
          <p>{prompt.message}</p>
          {prompt.options.map((option) => (
            <Button
              className="justify-start"
              disabled={complete.isPending}
              key={option.id}
              size="sm"
              variant="outline"
              onClick={() => complete.mutate({
                id: session.id,
                promptId: prompt.id,
                answer: option.id,
              })}
            >
              {option.label}
            </Button>
          ))}
        </div>
      ) : null}
      {isPending && prompt && prompt.type !== 'select' ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            complete.mutate({
              id: session.id,
              promptId: prompt.id,
              answer,
            });
          }}
        >
          <p>{prompt.message}</p>
          <div className="flex gap-2">
            <Input
              aria-label={prompt.message}
              autoComplete="off"
              placeholder={prompt.placeholder}
              type={prompt.type === 'secret' ? 'password' : 'text'}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
            />
            <Button
              disabled={complete.isPending || !answer}
              size="sm"
              type="submit"
            >{m.settings_providers_send()}</Button>
          </div>
        </form>
      ) : null}
      <FormErrors error={session.error ?? (complete.isError ? m.settings_providers_error() : null)} />
      {isPending ? (
        <Button
          className="self-end"
          disabled={cancel.isPending}
          size="sm"
          variant="ghost"
          onClick={() => cancel.mutate({ id: session.id })}
        >
          {m.ui_cancel()}
        </Button>
      ) : (
        <Button
          className="self-end"
          size="sm"
          variant="ghost"
          onClick={onClose}
        >
          {m.ui_close()}
        </Button>
      )}
    </div>
  );
}
