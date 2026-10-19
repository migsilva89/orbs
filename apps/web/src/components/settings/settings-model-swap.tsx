import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { botSwapModels } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { BotSettingsFields } from '@/components/bots/bot-settings-fields';
import { ButtonLoading } from '@/components/ui/button-loading';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormErrors, FormErrorsAndHint, FormField, FormItem, FormLabel } from '@/components/ui/forms/form';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { rpc } from '@/services/rpc/rpc.client';
import type { BotModelUsage } from '@/types/bot.types';

interface SettingsModelSwapProps {
  usage: BotModelUsage
  onClose: () => void
}

export function SettingsModelSwap({ usage, onClose }: SettingsModelSwapProps) {
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: standardSchemaResolver(botSwapModels),
    defaultValues: {
      from: usage.model,
      to: { modelProvider: '', modelId: '', thinkingLevel: 'medium' as const },
      botIds: [...new Set([...usage.primary, ...usage.fallbacks].map((bot) => bot.id))],
      includeFallbacks: false,
    },
  });

  const includeFallbacks = useWatch({ control: form.control, name: 'includeFallbacks' });
  const target = useWatch({ control: form.control, name: 'to' });
  const affected = [...new Map([...usage.primary, ...(includeFallbacks ? usage.fallbacks : [])].map((bot) => [bot.id, bot])).values()];

  const swap = useMutation(rpc.bots.swapModels.mutationOptions({
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: rpc.bots.list.key() });
      toast.success(m.settings_models_saved({ primary: result.primary, fallbacks: result.fallbacks }));
      onClose();
    },
  }));

  return (
    <Dialog open onOpenChange={(open) => !open && !swap.isPending && onClose()}>
      <DialogContent className="max-h-[85svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{m.settings_models_replace_title({ model: usage.model.modelId })}</DialogTitle>
          <DialogDescription>{m.settings_models_replace_hint()}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit((input) => swap.mutate({ ...input, botIds: affected.map((bot) => bot.id) }))}>
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{m.settings_models_target()}</FormLabel>
                  <BotSettingsFields
                    disabled={swap.isPending}
                    value={field.value}
                    onChange={field.onChange}
                  />
                  <FormErrorsAndHint />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="includeFallbacks"
              render={({ field }) => (
                <FormItem className="flex items-center">
                  <Checkbox
                    checked={field.value}
                    disabled={swap.isPending || usage.fallbacks.length === 0}
                    id="swap-fallbacks"
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <FormLabel htmlFor="swap-fallbacks">{m.settings_models_include_fallbacks()}</FormLabel>
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">{m.settings_models_affected({ count: affected.length })}</p>
              <ItemGroup className="max-h-56 overflow-y-auto" variant="outline">
                {affected.map((bot) => {
                  const primary = usage.primary.some((item) => item.id === bot.id);
                  const fallback = includeFallbacks && usage.fallbacks.some((item) => item.id === bot.id);
                  const scope = primary ? m.settings_models_primary() : m.settings_models_fallback();

                  return (
                    <Item key={bot.id} size="sm">
                      <ItemMedia><BotAvatar
                        animate={false}
                        bot={bot}
                        size={24}
                      /></ItemMedia>
                      <ItemContent>
                        <ItemTitle>{bot.name}</ItemTitle>
                        <ItemDescription>{primary && fallback ? m.settings_models_both() : scope}</ItemDescription>
                      </ItemContent>
                    </Item>
                  );
                })}
              </ItemGroup>
            </div>
            <FormErrors error={swap.isError ? m.settings_models_save_error() : null} />
            <DialogFooter>
              <ButtonLoading
                disabled={affected.length === 0 || !target.modelId}
                loading={swap.isPending}
                type="submit"
              >{m.settings_models_apply({ count: affected.length })}</ButtonLoading>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
