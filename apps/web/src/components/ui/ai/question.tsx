import { cn } from '@/lib/cn';
import IconLucideCheck from '~icons/lucide/check';
import IconLucidePencil from '~icons/lucide/pencil';
import type { ComponentProps, ReactNode } from 'react';

export function Question({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cn('flex max-w-md min-w-0 flex-col gap-3 rounded-2xl bg-secondary p-3 text-foreground', className)} data-slot="question" {...props} />;
}

export function QuestionHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex items-start gap-2 pt-0.5 pl-1', className)} data-slot="question-header" {...props} />;
}

export function QuestionIcon({ className, ...props }: ComponentProps<'span'>) {
  return <span aria-hidden="true" className={cn('flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground [&_svg]:size-4', className)} data-slot="question-icon" {...props} />;
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

const questionList = 'flex min-w-0 flex-col divide-y overflow-hidden rounded-lg border bg-background';

const questionRow = 'flex w-full min-w-0 items-center gap-3 px-3 py-2.5 text-left text-sm';

const questionBadge = 'flex-center size-6 shrink-0 rounded-md border text-xs font-medium text-muted-foreground tabular-nums';

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
    <li className="flex min-w-0 items-center transition-colors duration-100 hover:bg-accent has-[>button:focus-visible]:bg-accent" data-slot="question-item">
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

export function QuestionOption({ index, className, children, ...props }: ComponentProps<'button'> & { index: number }) {
  return (
    <button
      className={cn(
        questionRow,
        'group/option transition-colors duration-100 outline-none',
        'hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        'disabled:pointer-events-none disabled:opacity-50 aria-checked:bg-accent aria-pressed:bg-accent',
        className,
      )}
      data-slot="question-option"
      type="button"
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          questionBadge,
          'transition-colors duration-100',
          'group-aria-checked/option:border-primary group-aria-checked/option:bg-primary group-aria-checked/option:text-primary-foreground',
          'group-aria-pressed/option:border-primary group-aria-pressed/option:bg-primary group-aria-pressed/option:text-primary-foreground',
        )}
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

export function QuestionField({ action, className, ...props }: ComponentProps<'input'> & { action?: ReactNode }) {
  return (
    <div
      className="flex h-10 items-center gap-2 rounded-lg border bg-background pr-1 pl-3 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 has-[input:disabled]:opacity-50"
      data-slot="question-field"
    >
      <input className={cn('h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm', className)} {...props} />
      {action}
    </div>
  );
}
