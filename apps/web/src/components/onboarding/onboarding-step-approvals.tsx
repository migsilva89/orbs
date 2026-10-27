import { BOT_PERMISSION_HINTS, BOT_PERMISSION_LABELS } from '@repo/client/client';
import { useSettingsTools } from '@repo/client/react';
import { botFields } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { Button } from '@repo/ui/button';
import { ButtonLoading } from '@repo/ui/button-loading';
import { FormErrors } from '@repo/ui/forms/form';
import { Input } from '@repo/ui/input';
import { Label, LabelDescription } from '@repo/ui/label';
import { OnboardingSceneApprovals } from '@repo/ui/onboarding/onboarding-scene-approvals';
import { OnboardingStepLayout } from '@repo/ui/onboarding/onboarding-step-layout';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useId, useState } from 'react';
import { rpc } from '@/services/rpc/rpc.client';

export function OnboardingStepApprovals() {
  const navigate = useNavigate();
  const jevId = useId();
  const [jevApiKey, setJevApiKey] = useState('');
  const { data: settings } = useSuspenseQuery(rpc.tools.settings.queryOptions());
  const next = () => void navigate({ to: '/onboarding/$step', params: { step: 'bot' } });
  const save = useSettingsTools({ onDone: next });

  return (
    <OnboardingStepLayout
      actions={jevApiKey.trim() ? (
        <ButtonLoading
          disabled={save.isPending}
          form="onboarding-approvals"
          loading={save.isPending}
          type="submit"
        >
          {m.onboarding_approvals_save()}
        </ButtonLoading>
      ) : (
        <Button variant={settings.isJevConfigured ? 'default' : 'outline'} onClick={next}>
          {settings.isJevConfigured ? m.onboarding_next() : m.onboarding_skip()}
        </Button>
      )}
      back="model"
      description={m.onboarding_approvals_description()}
      scene={<OnboardingSceneApprovals />}
      title={m.onboarding_approvals_title()}
    >
      <dl className="m-0 flex flex-col gap-2.5">
        {botFields.shape.permission.options.map((option) => (
          <div className="flex flex-col gap-0.5" key={option}>
            <dt className="text-sm">{BOT_PERMISSION_LABELS[option]()}</dt>
            <dd className="m-0 text-xs text-muted-foreground">{BOT_PERMISSION_HINTS[option]()}</dd>
          </div>
        ))}
      </dl>
      <form
        className="flex flex-col gap-1.5"
        id="onboarding-approvals"
        onSubmit={(event) => {
          event.preventDefault();
          save.save({
            approvalRules: settings.approvalRules,
            approvalTimeoutMinutes: settings.approvalTimeoutMinutes,
            jevApiKey,
          });
        }}
      >
        <Label htmlFor={jevId}>{m.onboarding_approvals_jev()}</Label>
        <Input
          autoComplete="off"
          disabled={save.isPending}
          id={jevId}
          placeholder={settings.isJevConfigured ? m.settings_secret_saved() : m.settings_tools_jev_placeholder()}
          type="password"
          value={jevApiKey}
          onChange={(event) => setJevApiKey(event.target.value)}
        />
        <LabelDescription>{m.onboarding_approvals_jev_hint()}</LabelDescription>
        <FormErrors error={save.problem} />
      </form>
    </OnboardingStepLayout>
  );
}
