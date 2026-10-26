import { cva } from 'cva';
import { messageSurface, messageTile } from '@/components/ui/ai/message';
import { buttonGlossyEffects } from '@/components/ui/button';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { cn } from '@/lib/cn';
import IconLucideCheck from '~icons/lucide/check';
import IconLucidePencil from '~icons/lucide/pencil';
import type { VariantProps } from 'cva';
import type { ComponentProps, ReactNode } from 'react';

export function Question({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cn(messageSurface, 'flex max-w-md min-w-0 flex-col gap-3 p-3', className)} data-slot="question" {...props} />;
}

export function QuestionHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex items-start gap-2 pt-0.5 pl-1', className)} data-slot="question-header" {...props} />;
}

export function QuestionIcon({ className, ...props }: ComponentProps<'span'>) {
  return <span aria-hidden="true" className={cn(messageTile, className)} data-slot="question-icon" {...props} />;
}

export function QuestionHeading({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex min-w-0 flex-1 flex-col gap-0.5', className)} data-slot="question-heading" {...props} />;
}

export function QuestionTitle({ className, children, ...props }: ComponentProps<'h3'>) {
  return <h3 className={cn('text-sm font-medium text-balance wrap-break-word whitespace-pre-line', className)} data-slot="question-title" {...props}>{children}</h3>;
}

export function QuestionDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-xs text-pretty wrap-break-word whitespace-pre-line text-muted-foreground', className)} data-slot="question-description" {...props} />;
}

const questionList = 'flex min-w-0 flex-col divide-y overflow-hidden rounded-xl border border-input bg-background';

const questionRow = 'flex w-full min-w-0 items-center gap-3 px-3 py-2.5 text-left text-sm';

const questionBadge = 'flex-center size-6 shrink-0 rounded-md text-xs font-medium tabular-nums';

const questionBadgeTones = cva({
  base: [questionBadge, ...buttonGlossyEffects, 'relative'],
  variants: {
    tone: {
      default: 'bg-primary text-primary-foreground shadow-[0_1px_2px_0_rgba(14,18,27,0.24),0_0_0_1px_var(--color-primary)]',
      success: 'bg-success text-white shadow-[0_1px_2px_0_rgba(14,18,27,0.24),0_0_0_1px_var(--color-success)]',
      info: 'bg-blue-500 text-white shadow-[0_1px_2px_0_rgba(14,18,27,0.24),0_0_0_1px_var(--color-blue-500)]',
      muted: 'bg-zinc-500 text-white shadow-[0_1px_2px_0_rgba(14,18,27,0.24),0_0_0_1px_var(--color-zinc-500)]',
    },
  },
  defaultVariants: { tone: 'default' },
});

export function QuestionOptions({ className, ...props }: ComponentProps<'fieldset'>) {
  return <fieldset className={cn(questionList, className)} data-slot="question-options" {...props} />;
}

export function QuestionList({ className, ...props }: ComponentProps<'ul'>) {
  return <ul className={cn(questionList, className)} data-slot="question-list" {...props} />;
}

export function QuestionItem({ icon, description, action, className, children, ...props }: ComponentProps<'button'> & {
  icon: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <li className="flex min-w-0 items-center transition-colors duration-100 hover:bg-foreground/5 has-[>button:focus-visible]:bg-foreground/5" data-slot="question-item">
      <button className={cn(questionRow, 'flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset', className)} type="button" {...props}>
        <span aria-hidden="true" className={cn(questionBadge, '[&_svg]:size-3.5')}>{icon}</span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate">{children}</span>
          {description ? <span className="truncate text-xs text-muted-foreground">{description}</span> : null}
        </span>
      </button>
      {action ? <span className="shrink-0 pr-2">{action}</span> : null}
    </li>
  );
}

export function QuestionDetails({ className, ...props }: ComponentProps<'dl'>) {
  return <dl className={cn('grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-1 text-xs', className)} data-slot="question-details" {...props} />;
}

export function QuestionDetail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 wrap-break-word whitespace-pre-line">{children}</dd>
    </>
  );
}

const questionFirstLetter = 65;

export function QuestionOption({ index, tone, className, children, ...props }: ComponentProps<'button'> & VariantProps<typeof questionBadgeTones> & { index: number }) {
  return (
    <button
      className={cn(
        questionRow,
        'group/option transition-colors duration-100 outline-none',
        'hover:bg-foreground/5 focus-visible:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        'disabled:pointer-events-none disabled:opacity-50 aria-checked:bg-foreground/10 aria-pressed:bg-foreground/10',
        className,
      )}
      data-slot="question-option"
      type="button"
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(questionBadgeTones({ tone }), 'transition-colors duration-100')}
      >
        {String.fromCodePoint(questionFirstLetter + index)}
      </span>
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 wrap-break-word whitespace-pre-line">{children}</span>
    </button>
  );
}

export function QuestionAnswer({ index, className, children, ...props }: ComponentProps<'div'> & { index?: number }) {
  return (
    <div className={cn('flex w-full min-w-0 items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground', className)} data-slot="question-answer" {...props}>
      <span aria-hidden="true" className="flex-center size-6 shrink-0 rounded-md border text-xs font-medium tabular-nums">
        {index === undefined ? <IconLucidePencil className="size-3" /> : String.fromCodePoint(questionFirstLetter + index)}
      </span>
      <span className="min-w-0 flex-1 wrap-break-word whitespace-pre-line">{children}</span>
      <IconLucideCheck aria-hidden="true" className="size-4 shrink-0" />
    </div>
  );
}

/** A one-line answer in the composer's shell, rounded like the options above it, with `action` as its send button. */
export function QuestionField({ action, className, ...props }: ComponentProps<'input'> & { action?: ReactNode }) {
  return (
    <InputGroup className="min-h-11.5 rounded-xl has-[input:disabled]:opacity-50" data-slot="question-field" variant="prompt">
      <input className={cn('min-w-0 flex-1 self-stretch bg-transparent pl-4 text-base outline-none placeholder:text-muted-foreground md:text-sm', className)} {...props} />
      {action ? <InputGroupAddon align="inline-end">{action}</InputGroupAddon> : null}
    </InputGroup>
  );
}
