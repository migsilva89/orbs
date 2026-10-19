import { defineCatalog } from '@json-render/core';
import { defineRegistry, JSONUIProvider, Renderer, useBoundProp } from '@json-render/react';
import { schema } from '@json-render/react/schema';
import { artifactComponents } from '@openbots/contracts/universal';
import { Children, lazy, Suspense, useId } from 'react';
import { Response } from '@/components/ui/ai/response';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusDot } from '@/components/ui/status-dot';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/cn';
import { ARTIFACTS } from '@/services/artifacts/artifacts.constants';
import IconChevronDown from '~icons/lucide/chevron-down';
import IconExternalLink from '~icons/lucide/external-link';
import IconInfo from '~icons/lucide/info';
import type { StateStore } from '@json-render/core';
import type { ArtifactSpec } from '@openbots/contracts/universal';

const ArtifactChart = lazy(() => import('@/components/artifacts/artifact-chart').then((module) => ({ default: module.ArtifactChart })));

const { registry } = defineRegistry(defineCatalog(schema, { components: artifactComponents, actions: {} }), {
  components: {
    Stack: ({ props, children }) => (
      <div className={cn('flex min-w-0', props.direction === 'horizontal' ? 'flex-row flex-wrap items-start' : 'flex-col', ARTIFACTS.gaps[props.gap ?? 'md'])}>{children}</div>
    ),
    Grid: ({ props, children }) => <div className={cn('grid min-w-0 gap-4', ARTIFACTS.columns[props.columns ?? '2'])}>{children}</div>,
    Card: ({ props, children }) => (
      <Card>
        {props.title || props.description ? (
          <CardHeader>
            {props.title ? <CardTitle>{props.title}</CardTitle> : null}
            {props.description ? <CardDescription>{props.description}</CardDescription> : null}
          </CardHeader>
        ) : null}
        <CardContent>
          <div className="flex flex-col gap-4">{children}</div>
        </CardContent>
      </Card>
    ),
    Heading: ({ props }) => <h2 className={ARTIFACTS.headings[props.level ?? '2']}>{props.text}</h2>,
    Text: ({ props }) => <p className={cn('text-sm text-pretty', props.variant === 'muted' && 'text-muted-foreground')}>{props.text}</p>,
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
    Badge: ({ props }) => <Badge variant={props.variant ?? 'secondary'}>{props.text}</Badge>,
    List: ({ props }) => (
      <ItemGroup variant="outline">
        {props.items.map((item, index) => (
          <Item key={`${item.title}-${index}`} size="sm">
            <ItemContent className="min-w-0">
              <ItemTitle>
                {item.url ? (
                  <a
                    href={item.url}
                    rel="noreferrer"
                    target="_blank"
                  >{item.title}</a>
                ) : item.title}
              </ItemTitle>
              {item.description ? <ItemDescription>{item.description}</ItemDescription> : null}
            </ItemContent>
            {item.meta ? (
              <ItemActions>
                <ItemDescription>{item.meta}</ItemDescription>
              </ItemActions>
            ) : null}
          </Item>
        ))}
      </ItemGroup>
    ),
    Table: ({ props }) => (
      <Table>
        <TableHeader>
          <TableRow>
            {props.columns.map((column) => <TableHead className={cn(column.align === 'right' && 'text-right')} key={column.key}>{column.label}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.rows.map((row, index) => (
            <TableRow key={index}>
              {props.columns.map((column) => (
                <TableCell className={cn(column.align === 'right' && 'text-right')} key={column.key}>{row[column.key]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
        <ItemGroup variant="outline">
          {items.map((item, index) => (
            <Item key={`${item.title}-${index}`} size="sm">
              <Checkbox
                checked={item.done}
                id={`${id}-${index}`}
                onCheckedChange={(checked) => setItems(items.map((entry, position) => (position === index ? { ...entry, done: checked === true } : entry)))}
              />
              <ItemContent className="min-w-0">
                <ItemTitle>
                  <label className={cn(item.done && 'text-muted-foreground line-through')} htmlFor={`${id}-${index}`}>{item.title}</label>
                </ItemTitle>
                {item.description ? <ItemDescription>{item.description}</ItemDescription> : null}
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      );
    },
    Toggle: ({ props, bindings }) => {
      const id = useId();
      const [checked = false, setChecked] = useBoundProp(props.checked, bindings?.checked);

      return (
        <ItemGroup variant="outline">
          <Item size="sm">
            <ItemContent className="min-w-0">
              <ItemTitle>
                <label htmlFor={id}>{props.label}</label>
              </ItemTitle>
              {props.description ? <ItemDescription>{props.description}</ItemDescription> : null}
            </ItemContent>
            <ItemActions>
              <Switch
                checked={checked}
                id={id}
                onCheckedChange={setChecked}
              />
            </ItemActions>
          </Item>
        </ItemGroup>
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
      <Collapsible className="flex flex-col" defaultOpen={props.open ?? true}>
        <CollapsibleTrigger asChild>
          <Button
            className="group self-start"
            size="sm"
            type="button"
            variant="link-muted"
          >
            {props.title}
            <IconChevronDown className="group-data-[state=open]:rotate-180" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="-m-1 flex flex-col gap-4 p-1 pt-3">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    ),
    Markdown: ({ props }) => <Response>{props.text}</Response>,
    KeyValue: ({ props }) => (
      <ItemGroup variant="outline">
        {props.items.map((item, index) => (
          <Item key={`${item.label}-${index}`} size="sm">
            <ItemContent className="min-w-0">
              <ItemDescription>{item.label}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <ItemTitle>{item.value}</ItemTitle>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    ),
    Status: ({ props }) => (
      <div className="flex items-start gap-2">
        <span className="flex h-5 items-center">
          <StatusDot label={props.label} variant={props.state} />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium">{props.label}</span>
          {props.description ? <span className="text-xs text-muted-foreground">{props.description}</span> : null}
        </div>
      </div>
    ),
    Alert: ({ props }) => (
      <Alert variant={props.variant ?? 'default'}>
        <IconInfo />
        <AlertTitle>{props.title}</AlertTitle>
        {props.description ? <AlertDescription>{props.description}</AlertDescription> : null}
      </Alert>
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
          className="max-h-96 w-full rounded-xl object-cover"
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
            <SelectTrigger id={id}>
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
}

export function ArtifactView({ spec, store }: ArtifactViewProps) {
  return (
    <JSONUIProvider registry={registry} store={store}>
      <Renderer registry={registry} spec={spec} />
    </JSONUIProvider>
  );
}
