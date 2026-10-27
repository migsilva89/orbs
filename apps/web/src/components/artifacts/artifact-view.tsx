import { defineCatalog } from '@json-render/core';
import { defineRegistry, JSONUIProvider, Renderer, useBoundProp } from '@json-render/react';
import { schema } from '@json-render/react/schema';
import { artifactComponents } from '@repo/contracts/universal';
import { Children, lazy, Suspense, useId } from 'react';
import { match, P } from 'ts-pattern';
import { Event, EventLabel, EventTrigger } from '@/components/ui/ai/event';
import { messageList, messageRow, messageSurface } from '@/components/ui/ai/message';
import { Response } from '@/components/ui/ai/response';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CollapsibleContent } from '@/components/ui/collapsible';
import { HtmlFrame } from '@/components/ui/html-frame';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusDot } from '@/components/ui/status-dot';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/cn';
import { ARTIFACTS } from '@/services/artifacts/artifacts.constants';
import IconExternalLink from '~icons/lucide/external-link';
import IconInfo from '~icons/lucide/info';
import type { StateStore } from '@json-render/core';
import type { ArtifactSpec } from '@repo/contracts/universal';
import type { ReactNode } from 'react';

const ArtifactChart = lazy(() => import('@/components/artifacts/artifact-chart').then((module) => ({ default: module.ArtifactChart })));

interface ArtifactViewRowTextProps {
  description?: string
  children: ReactNode
}

function ArtifactViewRowText({ description, children }: ArtifactViewRowTextProps) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="wrap-break-word">{children}</span>
      {description ? <span className="text-xs text-pretty text-muted-foreground">{description}</span> : null}
    </span>
  );
}

const { registry } = defineRegistry(defineCatalog(schema, { components: artifactComponents, actions: {} }), {
  components: {
    Stack: ({ props, children }) => (
      <div className={cn('flex min-w-0', props.direction === 'horizontal' ? 'flex-row flex-wrap items-start' : 'flex-col', ARTIFACTS.gaps[props.gap ?? 'md'])}>{children}</div>
    ),
    Grid: ({ props, children }) => <div className={cn('grid min-w-0 gap-4', ARTIFACTS.columns[props.columns ?? '2'])}>{children}</div>,
    Card: ({ props, children }) => (
      <section className={cn(messageSurface, 'flex min-w-0 flex-col gap-3 p-3')}>
        {props.title || props.description ? (
          <header className="flex min-w-0 flex-col gap-0.5 pt-0.5">
            {props.title ? <h3 className="text-sm font-medium text-balance">{props.title}</h3> : null}
            {props.description ? <p className="text-xs text-pretty text-muted-foreground">{props.description}</p> : null}
          </header>
        ) : null}
        <div className="flex flex-col gap-3">{children}</div>
      </section>
    ),
    Heading: ({ props }) => <h2 className={ARTIFACTS.headings[props.level ?? '2']}>{props.text}</h2>,
    Text: ({ props }) => <p className={cn('text-sm leading-snug text-pretty', props.variant === 'muted' && 'text-muted-foreground')}>{props.text}</p>,
    Stat: ({ props }) => {
      const Trend = props.trend ? ARTIFACTS.trendIcons[props.trend] : null;

      return (
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs text-muted-foreground">{props.label}</span>
          <span className="text-2xl font-semibold tabular-nums">{props.value}</span>
          {props.change ? (
            <span className={cn('flex items-center gap-1 text-xs tabular-nums', props.trend === 'up' && 'text-success', props.trend === 'down' && 'text-destructive')}>
              {Trend ? <Trend className="size-3" /> : null}
              {props.change}
            </span>
          ) : null}
          {props.hint ? <span className="text-xs text-muted-foreground">{props.hint}</span> : null}
        </div>
      );
    },
    Badge: ({ props }) => <Badge variant={ARTIFACTS.badges[props.variant ?? 'secondary']}>{props.text}</Badge>,
    List: ({ props }) => (
      <ul className={messageList}>
        {props.items.map((item, index) => (
          <li className={messageRow} key={`${item.title}-${index}`}>
            <ArtifactViewRowText description={item.description}>
              {item.url ? (
                <a
                  className="underline decoration-current/35 underline-offset-2 hover:decoration-current"
                  href={item.url}
                  rel="noreferrer"
                  target="_blank"
                >{item.title}</a>
              ) : item.title}
            </ArtifactViewRowText>
            {item.meta ? <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{item.meta}</span> : null}
          </li>
        ))}
      </ul>
    ),
    Table: ({ props }) => (
      <div className={cn(messageList, 'scrollbar block overflow-x-auto [--scrollbar-thumb:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] [--scrollbar-track:transparent] scrollbar-h-1 scrollbar-thumb-rounded-full')}>
        <table className="w-max min-w-full border-collapse text-sm">
          <thead>
            <tr>
              {props.columns.map((column) => <th className={cn('px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground', column.align === 'right' && 'text-right')} key={column.key}>{column.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row, index) => (
              <tr className="border-t" key={index}>
                {props.columns.map((column) => (
                  <td className={cn('px-3 py-2.5 whitespace-nowrap tabular-nums', column.align === 'right' && 'text-right')} key={column.key}>{row[column.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    Progress: ({ props }) => (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span>{props.label}</span>
          <span className="text-muted-foreground tabular-nums">{props.value}%</span>
        </div>
        <Progress value={props.value} />
        {props.hint ? <span className="text-xs text-muted-foreground">{props.hint}</span> : null}
      </div>
    ),
    Separator: () => <Separator />,
    LineChart: ({ props }) => (
      <Suspense fallback={<Skeleton className="h-56 w-full" />}>
        <ArtifactChart chart={{ kind: 'line', ...props }} />
      </Suspense>
    ),
    BarChart: ({ props }) => (
      <Suspense fallback={<Skeleton className="h-56 w-full" />}>
        <ArtifactChart chart={{ kind: 'bar', ...props }} />
      </Suspense>
    ),
    Checklist: ({ props, bindings }) => {
      const id = useId();
      const [items = [], setItems] = useBoundProp(props.items, bindings?.items);

      return (
        <ul className={messageList}>
          {items.map((item, index) => (
            <li className={messageRow} key={`${item.title}-${index}`}>
              <Checkbox
                checked={item.done}
                id={`${id}-${index}`}
                onCheckedChange={(checked) => setItems(items.map((entry, position) => (position === index ? { ...entry, done: checked === true } : entry)))}
              />
              <ArtifactViewRowText description={item.description}>
                <label className={cn('cursor-pointer', item.done && 'text-muted-foreground line-through')} htmlFor={`${id}-${index}`}>{item.title}</label>
              </ArtifactViewRowText>
            </li>
          ))}
        </ul>
      );
    },
    Toggle: ({ props, bindings }) => {
      const id = useId();
      const [checked = false, setChecked] = useBoundProp(props.checked, bindings?.checked);

      return (
        <div className={messageList}>
          <div className={messageRow}>
            <ArtifactViewRowText description={props.description}>
              <label className="cursor-pointer" htmlFor={id}>{props.label}</label>
            </ArtifactViewRowText>
            <Switch
              checked={checked}
              id={id}
              onCheckedChange={setChecked}
            />
          </div>
        </div>
      );
    },
    Tabs: ({ props, children }) => (
      <Tabs defaultValue="0">
        <TabsList>
          {props.tabs.map((tab, index) => <TabsTrigger key={tab} value={String(index)}>{tab}</TabsTrigger>)}
        </TabsList>
        {Children.toArray(children).map((panel, index) => (
          <TabsContent key={props.tabs[index] ?? index} value={String(index)}>
            <div className="flex flex-col gap-4 pt-2">{panel}</div>
          </TabsContent>
        ))}
      </Tabs>
    ),
    Section: ({ props, children }) => (
      <Event defaultOpen={props.open ?? true}>
        <EventTrigger>
          <EventLabel>{props.title}</EventLabel>
        </EventTrigger>
        <CollapsibleContent className="w-full">
          <div className="flex flex-col gap-4 pt-2">{children}</div>
        </CollapsibleContent>
      </Event>
    ),
    Markdown: ({ props }) => (
      <div className="text-sm leading-snug">
        <Response>{props.text}</Response>
      </div>
    ),
    KeyValue: ({ props }) => (
      <dl className={messageList}>
        {props.items.map((item, index) => (
          <div className={messageRow} key={`${item.label}-${index}`}>
            <dt className="min-w-0 flex-1 truncate text-muted-foreground">{item.label}</dt>
            <dd className="shrink-0 tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
    ),
    Status: ({ props }) => (
      <div className="flex items-start gap-2">
        <span className="flex h-5 items-center">
          <StatusDot label={props.label} variant={props.state} />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-sm leading-snug font-medium">{props.label}</span>
          {props.description ? <span className="text-xs text-muted-foreground">{props.description}</span> : null}
        </div>
      </div>
    ),
    Alert: ({ props }) => (
      <div className={cn(messageList, 'flex-row items-start gap-3 px-3 py-2.5 text-sm', props.variant === 'destructive' && 'text-destructive')} role="alert">
        <IconInfo className="mt-0.5 size-4 shrink-0" />
        <ArtifactViewRowText description={props.description}>{props.title}</ArtifactViewRowText>
      </div>
    ),
    LinkButton: ({ props }) => (
      <Button
        asChild
        className="self-start"
        size="sm"
        variant="outline"
      >
        <a
          href={props.url}
          rel="noreferrer"
          target="_blank"
        >
          {props.label}
          <IconExternalLink />
        </a>
      </Button>
    ),
    Image: ({ props }) => (
      <figure className="flex flex-col gap-2">
        <img
          alt={props.alt}
          className="max-h-96 w-full rounded-xl border object-cover"
          loading="lazy"
          src={props.url}
        />
        {props.caption ? <figcaption className="text-xs text-muted-foreground">{props.caption}</figcaption> : null}
      </figure>
    ),
    AreaChart: ({ props }) => (
      <Suspense fallback={<Skeleton className="h-56 w-full" />}>
        <ArtifactChart chart={{ kind: 'area', ...props }} />
      </Suspense>
    ),
    PieChart: ({ props }) => (
      <Suspense fallback={<Skeleton className="mx-auto size-56" />}>
        <ArtifactChart chart={{ kind: 'pie', ...props }} />
      </Suspense>
    ),
    Select: ({ props, bindings }) => {
      const id = useId();
      const [value, setValue] = useBoundProp(props.value, bindings?.value);

      return (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor={id}>{props.label}</label>
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger id={id} variant="field">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {props.options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    },
    Notes: ({ props, bindings }) => {
      const id = useId();
      const [value = '', setValue] = useBoundProp(props.value, bindings?.value);

      return (
        <div className="flex flex-col gap-2">
          {props.label ? <label className="text-sm font-medium" htmlFor={id}>{props.label}</label> : null}
          <Textarea
            defaultValue={value}
            id={id}
            key={value}
            placeholder={props.placeholder}
            variant="field"
            onBlur={(event) => event.target.value !== value && setValue(event.target.value)}
          />
        </div>
      );
    },
  },
});

interface ArtifactViewProps {
  spec: ArtifactSpec
  store: StateStore
  title: string
}

export function ArtifactView({ spec, store, title }: ArtifactViewProps) {
  return match(spec)
    .with({ html: P.string }, ({ html }) => (
      <HtmlFrame
        html={html}
        key={html}
        title={title}
      />
    ))
    .otherwise((structured) => (
      <JSONUIProvider
        key={JSON.stringify(structured.elements)}
        registry={registry}
        store={store}
      >
        <Renderer registry={registry} spec={structured} />
      </JSONUIProvider>
    ));
}
