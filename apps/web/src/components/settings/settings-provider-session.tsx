import { useSettingsProviderSession } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { match } from 'ts-pattern';
import { Button } from '@/components/ui/button';
import { FormErrors } from '@/components/ui/forms/form';
import { Input } from '@/components/ui/input';
import IconX from '~icons/lucide/x';
import type { ProviderSession } from '@openbots/contracts/universal';

interface SettingsProviderSessionProps {
  session: ProviderSession
  onClose: () => void
}

export function SettingsProviderSession({ session: started, onClose }: SettingsProviderSessionProps) {
  const login = useSettingsProviderSession(started);
  const { session, isPending, answer, setAnswer } = login;
  const { prompt } = session;

  return (
    <div className="relative flex flex-col gap-2 rounded-lg border p-3 pr-10 text-sm">
      <Button
        aria-label={isPending ? m.ui_cancel() : m.ui_close()}
        className="absolute top-1.5 right-1.5"
        disabled={login.isCancelling}
        size="icon-xs"
        title={isPending ? m.ui_cancel() : m.ui_close()}
        variant="ghost"
        onClick={isPending ? login.cancel : onClose}
      >
        <IconX />
      </Button>
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
              disabled={login.isAnswering}
              key={option.id}
              size="sm"
              variant="outline"
              onClick={() => login.reply(option.id)}
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
            login.reply(answer);
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
              disabled={login.isAnswering || !answer}
              size="sm"
              type="submit"
            >{m.settings_providers_send()}</Button>
          </div>
        </form>
      ) : null}
      <FormErrors error={login.problem} />
    </div>
  );
}
