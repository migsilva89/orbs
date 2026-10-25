import { ORPCError } from '@orpc/client';
import { authPairEntry, connectionPairForm } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { REGEXP_ONLY_DIGITS } from 'input-otp-native';
import { useId, useRef, useState } from 'react';
import { View } from 'react-native';
import { match, P } from 'ts-pattern';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { FormInput } from '@/components/ui/form-input';
import { InputOtp } from '@/components/ui/input-otp';
import { Label, LabelDescription } from '@/components/ui/label';
import { useConnection } from '@/hooks/use-connection';
import { useConnectionCode } from '@/hooks/use-connection-code';
import { connectionPair, connectionRead } from '@/services/connection/connection.client';
import { connectionAddressFromInput, connectionCodeFromUrl, connectionDeviceName } from '@/services/connection/connection.utils';
import type { AuthPairEntry } from '@repo/contracts/universal';

export function ConnectForm() {
  const { connect } = useConnection();
  const { code, setCode, linkedPin, target, setTarget, linkError } = useConnectionCode();
  const codeLabelId = useId();
  const pastedTarget = useRef<AuthPairEntry['target']>(null);
  const [addressText, setAddressText] = useState('');
  const [name, setName] = useState(connectionDeviceName());
  const [addressError, setAddressError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPairing, setIsPairing] = useState(false);
  const form = connectionPairForm.safeParse({ code, name });
  const address = connectionAddressFromInput(addressText);
  const needsAddress = !target;

  function pastePin(text: string): string {
    const pasted = (text.startsWith(code) ? text.slice(code.length) : text).trim();
    const entry = authPairEntry.safeParse(connectionCodeFromUrl(pasted) ?? pasted);

    return match(entry)
      .with({ success: true }, ({ data }) => {
        pastedTarget.current = data.target ?? pastedTarget.current;
        setTarget(data.target ?? target);

        return data.pin;
      })
      .otherwise(() => `${code}${pasted.replaceAll(/\D/gu, '')}`);
  }

  async function handleSubmit(pin = code) {
    const entry = authPairEntry.safeParse(pin);
    const pairTarget = pastedTarget.current ?? target;

    await match({
      entry,
      form: connectionPairForm.safeParse({ code: pin, name }),
      isAddressMissing: !pairTarget && !address,
    })
      .with({ entry: { success: false } }, () => setCodeError(m.connect_code_invalid()))
      .with({ isAddressMissing: true }, () => setAddressError(m.connect_address_invalid()))
      .with({ form: { success: false } }, () => setNameError(m.mobile_device_name_invalid()))
      .with({ entry: { success: true }, form: { success: true } }, async ({ entry: parsed, form: values }) => {
        setError(null);
        setAddressError(null);
        setCodeError(null);
        setNameError(null);
        setIsPairing(true);
        try {
          connect(await connectionPair({
            entry: { pin: parsed.data.pin, target: pairTarget },
            address,
            name: values.data.name,
          }));
        } catch (failure) {
          const saved = await connectionRead().catch(() => null);

          match({ failure, saved })
            .with({ saved: P.nonNullable }, ({ saved: connection }) => connect(connection))
            .when(({ failure: value }) => value instanceof ORPCError && value.code === 'UNAUTHORIZED', () => setCodeError(m.connect_failed()))
            .otherwise(() => setError(m.connect_unreachable()));
        } finally {
          setIsPairing(false);
        }
      })
      .exhaustive();
  }

  return (
    <View className="w-full max-w-68 gap-4 self-center">
      {needsAddress ? (
        <FormInput
          required
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isPairing}
          error={addressError}
          hint={m.connect_address_hint()}
          inputMode="url"
          label={m.connect_address()}
          placeholder={m.connect_address_placeholder()}
          testID="connect-address"
          value={addressText}
          onChangeText={(value) => {
            setAddressText(value);
            setAddressError(null);
          }}
        />
      ) : null}
      <View className="gap-2">
        <Label
          required
          invalid={Boolean(codeError)}
          nativeID={codeLabelId}
        >
          {m.connect_code()}
        </Label>
        <InputOtp
          accessibilityLabel={m.connect_code()}
          accessibilityLabelledBy={codeLabelId}
          defaultValue={linkedPin}
          editable={!isPairing}
          invalid={Boolean(codeError)}
          key={linkedPin}
          maxLength={6}
          pasteTransformer={pastePin}
          pattern={REGEXP_ONLY_DIGITS}
          testID="connect-code"
          textContentType="oneTimeCode"
          onChange={(value) => {
            setCode(value);
            setCodeError(null);
          }}
          onComplete={(value: string) => void handleSubmit(value)}
        />
        {codeError ? <LabelDescription accessibilityRole="alert" variant="error">{codeError}</LabelDescription> : null}
      </View>
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
          disabled={!form.success || (needsAddress && !address)}
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
