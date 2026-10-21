import { authPairCode, connectionPairForm } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { useState } from 'react';
import { View } from 'react-native';
import { match, P } from 'ts-pattern';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { FormInput } from '@/components/ui/form-input';
import { LabelDescription } from '@/components/ui/label';
import { useConnection } from '@/hooks/use-connection';
import { useConnectionCode } from '@/hooks/use-connection-code';
import { connectionPair, connectionRead } from '@/services/connection/connection.client';
import { connectionCodeFromUrl } from '@/services/connection/connection.utils';

export function ConnectForm() {
  const { connect } = useConnection();
  const { code, setCode, linkError } = useConnectionCode();
  const [name, setName] = useState<string>(m.mobile_device_name_default());
  const [codeError, setCodeError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPairing, setIsPairing] = useState(false);
  const pairCode = connectionCodeFromUrl(code.trim()) ?? code;
  const form = connectionPairForm.safeParse({ code: pairCode, name });

  async function handleSubmit() {
    const payload = authPairCode.safeParse(pairCode);
    await match({ payload, form })
      .with({ payload: { success: false } }, () => setCodeError(m.connect_code_invalid()))
      .with({ form: { success: false } }, () => setNameError(m.mobile_device_name_invalid()))
      .with({ payload: { success: true }, form: { success: true } }, async ({ payload: parsed, form: values }) => {
        setError(null);
        setCodeError(null);
        setNameError(null);
        setIsPairing(true);
        try {
          connect(await connectionPair({ payload: parsed.data, name: values.data.name }));
        } catch {
          const saved = await connectionRead().catch(() => null);

          match(saved)
            .with(P.nonNullable, connect)
            .otherwise(() => setError(m.connect_failed()));
        } finally {
          setIsPairing(false);
        }
      })
      .exhaustive();
  }

  return (
    <View className="gap-4">
      <FormInput
        required
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isPairing}
        error={codeError}
        hint={m.connect_code_hint()}
        label={m.connect_code()}
        placeholder={m.connect_code_placeholder()}
        testID="connect-code"
        value={code}
        onChangeText={(value) => {
          setCode(value);
          setCodeError(null);
        }}
      />
      <FormInput
        required
        editable={!isPairing}
        error={nameError}
        label={m.connect_device_name()}
        maxLength={100}
        returnKeyType="done"
        testID="connect-name"
        value={name}
        onChangeText={(value) => {
          setName(value);
          setNameError(null);
        }}
      />
      {(error ?? linkError) ? <LabelDescription accessibilityRole="alert" variant="error">{error ?? linkError}</LabelDescription> : null}
      <CardFooter>
        <Button
          className="w-full"
          disabled={!form.success}
          loading={isPairing}
          testID="connect-submit"
          onPress={() => void handleSubmit()}
        >
          {m.connect_submit()}
        </Button>
      </CardFooter>
    </View>
  );
}
