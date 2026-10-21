import { useSettingsProviderSession } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { X } from 'lucide-react-native';
import { Linking, View } from 'react-native';
import { match } from 'ts-pattern';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { LabelDescription } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import type { ProviderSession } from '@openbots/contracts/universal';

interface SettingsProviderSessionProps {
  session: ProviderSession;
  onClose: () => void;
}

export function SettingsProviderSession({ session: started, onClose }: SettingsProviderSessionProps) {
  const login = useSettingsProviderSession(started);
  const { session, isPending, answer, setAnswer } = login;
  const { prompt } = session;

  return (
    <View className="gap-3 rounded-lg border border-border bg-card p-3 pr-11">
      <Button
        accessibilityLabel={isPending ? m.ui_cancel() : m.ui_close()}
        className="absolute top-1.5 right-1.5"
        disabled={login.isCancelling}
        size="icon-xs"
        variant="ghost"
        onPress={isPending ? login.cancel : onClose}
      >
        <Icon icon={X} size="sm" />
      </Button>
      {isPending ? session.events.map((event, index) => match(event)
        .with({ type: 'auth_url' }, ({ url, instructions }) => (
          <View className="gap-2" key={index}>
            <Text>{instructions ?? m.settings_providers_open_link()}</Text>
            <Button
              size="sm"
              variant="outline"
              onPress={() => void Linking.openURL(url)}
            >
              {m.settings_providers_link()}
            </Button>
          </View>
        ))
        .with({ type: 'device_code' }, ({ userCode, verificationUri }) => (
          <View className="gap-2" key={index}>
            <Text>{m.settings_providers_device_code({ code: userCode })}</Text>
            <Button
              size="sm"
              variant="outline"
              onPress={() => void Linking.openURL(verificationUri)}
            >
              {m.settings_providers_link()}
            </Button>
          </View>
        ))
        .with({ type: 'info' }, { type: 'progress' }, ({ message }) => <LabelDescription key={index}>{message}</LabelDescription>)
        .exhaustive()) : null}
      {isPending && prompt?.type === 'select' ? (
        <View className="gap-2">
          <Text>{prompt.message}</Text>
          {prompt.options.map((option) => (
            <Button
              disabled={login.isAnswering}
              key={option.id}
              size="sm"
              variant="outline"
              onPress={() => login.reply(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </View>
      ) : null}
      {isPending && prompt && prompt.type !== 'select' ? (
        <View className="gap-2">
          <Text>{prompt.message}</Text>
          <Input
            accessibilityLabel={prompt.message}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={prompt.placeholder}
            secureTextEntry={prompt.type === 'secret'}
            value={answer}
            onChangeText={setAnswer}
            onSubmitEditing={() => answer && login.reply(answer)}
          />
          <Button
            disabled={login.isAnswering || !answer}
            size="sm"
            onPress={() => login.reply(answer)}
          >
            {m.settings_providers_send()}
          </Button>
        </View>
      ) : null}
      {login.problem ? <LabelDescription accessibilityRole="alert" variant="error">{login.problem}</LabelDescription> : null}
    </View>
  );
}
