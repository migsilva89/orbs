import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { routineEditForm } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { FormProvider, useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { match, P } from 'ts-pattern';
import { useCSSVariable } from 'uniwind';
import { BotLoadState } from '@/components/bots/bot-load-state';
import { FormField } from '@/components/ui/form-field';
import { Text } from '@/components/ui/text';
import { useConnection } from '@/hooks/use-connection';
import { RoutinesScheduleField } from './routines-schedule-field';
import type { RpcSession } from '@/types/rpc.types';
import type { Routine, RoutineEditForm } from '@repo/contracts/universal';

interface RoutinesEditScreenProps {
  botId: string;
  routineId: string;
}

export function RoutinesEditScreen({ botId, routineId }: RoutinesEditScreenProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => (
      <RoutinesEditScreenLoader
        botId={botId}
        routineId={routineId}
        session={current}
      />
    ))
    .otherwise(() => null);
}

interface RoutinesEditScreenLoaderProps extends RoutinesEditScreenProps {
  session: RpcSession;
}

function RoutinesEditScreenLoader({ session, botId, routineId }: RoutinesEditScreenLoaderProps) {
  const routines = useQuery(session.rpc.routines.list.queryOptions({ input: { botId } }));

  return match(routines.data?.find((item) => item.id === routineId))
    .with(P.nonNullable, (routine) => (
      <RoutinesEditScreenForm
        botId={botId}
        routine={routine}
        session={session}
      />
    ))
    .otherwise(() => (
      <BotLoadState
        isError={routines.isError}
        isMissing={routines.isSuccess}
        onRetry={() => void routines.refetch()}
      />
    ));
}

interface RoutinesEditScreenFormProps {
  session: RpcSession;
  botId: string;
  routine: Routine;
}

function RoutinesEditScreenForm({ session, botId, routine }: RoutinesEditScreenFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [primary, primaryForeground] = useCSSVariable(['--color-primary', '--color-primary-foreground']).map(String);

  const form = useForm<RoutineEditForm>({
    resolver: standardSchemaResolver(routineEditForm),
    defaultValues: { name: routine.name, schedule: routine.schedule, prompt: routine.prompt },
  });

  const save = useMutation(session.rpc.routines.update.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: session.rpc.routines.key() });
      router.back();
    },
  }));

  const submit = form.handleSubmit((input) => save.mutate({
    ...input,
    botId,
    routineId: routine.id,
  }));

  return (
    <FormProvider {...form}>
      <Stack.Screen options={{ title: m.rooms_routines_edit_title({ name: routine.name }) }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          disabled={save.isPending}
          style={{ color: primaryForeground }}
          tintColor={primary}
          variant="done"
          onPress={() => void submit()}
        >
          {m.rooms_routines_save()}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <View className="flex-1 bg-background">
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerClassName="gap-6 px-4 pt-4 pb-12"
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          <Text tone="muted" variant="small">{m.rooms_routines_edit_hint()}</Text>
          <FormField
            required
            control={form.control}
            editable={!save.isPending}
            label={m.rooms_routines_name()}
            maxLength={80}
            name="name"
          />
          <RoutinesScheduleField isDisabled={save.isPending} />
          <FormField
            multiline
            control={form.control}
            editable={!save.isPending}
            label={m.rooms_routines_prompt()}
            maxLength={8000}
            name="prompt"
          />
          {save.isError ? <Text tone="destructive" variant="small">{m.rooms_routines_save_failed()}</Text> : null}
        </ScrollView>
      </View>
    </FormProvider>
  );
}
