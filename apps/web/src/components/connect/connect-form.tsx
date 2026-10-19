import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { authPairCode, connectionPairForm } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { useForm } from 'react-hook-form';
import { match } from 'ts-pattern';
import { ButtonLoading } from '@/components/ui/button-loading';
import { Form } from '@/components/ui/forms/form';
import { FormInput } from '@/components/ui/forms/form-input';
import { toasty } from '@/components/ui/sonner';
import { connectionPair } from '@/services/connection/connection.client';
import type { ConnectionPairForm } from '@openbots/contracts/universal';

export function ConnectForm() {
  const form = useForm({
    resolver: standardSchemaResolver(connectionPairForm),
    defaultValues: {
      code: new URLSearchParams(location.hash.slice(1)).get('code') ?? '',
      name: m.connect_device_name_default(),
    },
  });

  async function handleSubmit({ code, name }: ConnectionPairForm) {
    const payload = authPairCode.safeParse(code);

    await match(payload)
      .with({ success: false }, () => {
        form.setError('code', { message: m.connect_code_invalid() });
      })
      .with({ success: true }, async ({ data }) => {
        try {
          await connectionPair({ payload: data, name });
          location.assign('/rooms');
        } catch {
          toasty(m.connect_failed(), '🔴', { id: 'connect' });
        }
      })
      .exhaustive();
  }

  return (
    <Form {...form}>
      <form className="grid gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <fieldset className="contents" disabled={form.formState.isSubmitting}>
          <FormInput
            required
            hint={<span className="text-xs text-muted-foreground">{m.connect_code_hint()}</span>}
            label={m.connect_code()}
            name="code"
            placeholder={m.connect_code_placeholder()}
          />
          <FormInput
            required
            label={m.connect_device_name()}
            name="name"
          />
          <ButtonLoading
            className="w-full"
            disabled={!form.formState.isValid}
            loading={form.formState.isSubmitting}
            type="submit"
          >
            {m.connect_submit()}
          </ButtonLoading>
        </fieldset>
      </form>
    </Form>
  );
}
