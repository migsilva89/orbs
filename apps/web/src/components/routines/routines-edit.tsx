import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { routineEditForm } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { ButtonLoading } from '@repo/ui/button-loading';
import { Form, FormControl, FormErrors, FormErrorsAndHint, FormField, FormItem, FormLabel } from '@repo/ui/forms/form';
import { FormInput } from '@repo/ui/forms/form-input';
import { RoutinesScheduleFields } from '@repo/ui/routines/routines-schedule-fields';
import { Textarea } from '@repo/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { rpc } from '@/services/rpc/rpc.client';
import type { Bot, Routine, RoutineEditForm } from '@repo/contracts/universal';

interface RoutinesEditProps {
  bot: Bot
  routine: Routine
  onDone: () => void
}

export function RoutinesEdit({ bot, routine, onDone }: RoutinesEditProps) {
  const queryClient = useQueryClient();

  const form = useForm<RoutineEditForm>({
    resolver: standardSchemaResolver(routineEditForm),
    defaultValues: { name: routine.name, schedule: routine.schedule, prompt: routine.prompt },
  });

  const save = useMutation(rpc.routines.update.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rpc.routines.key() });
      onDone();
    },
  }));

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-3"
        onSubmit={form.handleSubmit((input) => save.mutate({
          ...input,
          botId: bot.id,
          routineId: routine.id,
        }))}
      >
        <fieldset className="contents" disabled={save.isPending}>
          <FormInput
            required
            label={m.rooms_routines_name()}
            maxLength={80}
            name="name"
          />
          <RoutinesScheduleFields />
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{m.rooms_routines_prompt()}</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-32"
                    maxLength={8000}
                    {...field}
                  />
                </FormControl>
                <FormErrorsAndHint />
              </FormItem>
            )}
          />
          <FormErrors error={save.isError ? m.rooms_routines_save_failed() : null} />
          <ButtonLoading
            className="self-end"
            loading={save.isPending}
            type="submit"
          >
            {m.rooms_routines_save()}
          </ButtonLoading>
        </fieldset>
      </form>
    </Form>
  );
}
