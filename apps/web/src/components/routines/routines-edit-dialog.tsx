import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { routineEditForm } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { RoutinesScheduleFields } from '@/components/routines/routines-schedule-fields';
import { ButtonLoading } from '@/components/ui/button-loading';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormErrors, FormErrorsAndHint, FormField, FormItem, FormLabel } from '@/components/ui/forms/form';
import { FormInput } from '@/components/ui/forms/form-input';
import { Textarea } from '@/components/ui/textarea';
import { rpc } from '@/services/rpc/rpc.client';
import type { Bot, Routine, RoutineEditForm } from '@repo/contracts/universal';

interface RoutinesEditDialogProps {
  bot: Bot
  routine: Routine
  onOpenChange: (open: boolean) => void
}

export function RoutinesEditDialog({ bot, routine, onOpenChange }: RoutinesEditDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<RoutineEditForm>({
    resolver: standardSchemaResolver(routineEditForm),
    defaultValues: { name: routine.name, schedule: routine.schedule, prompt: routine.prompt },
  });

  const save = useMutation(rpc.routines.update.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rpc.routines.key() });
      onOpenChange(false);
    },
  }));

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85svh] grid-cols-1 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{m.rooms_routines_edit_title({ name: routine.name })}</DialogTitle>
          <DialogDescription>{m.rooms_routines_edit_hint()}</DialogDescription>
        </DialogHeader>
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
              <ButtonLoading loading={save.isPending} type="submit">
                {m.rooms_routines_save()}
              </ButtonLoading>
            </fieldset>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
