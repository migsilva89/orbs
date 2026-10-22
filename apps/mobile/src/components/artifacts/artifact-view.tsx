import { defineCatalog } from '@json-render/core';
import { defineRegistry, JSONUIProvider, Renderer, useBoundProp } from '@json-render/react-native';
import { schema } from '@json-render/react-native/schema';
import { artifactComponents } from '@repo/contracts/universal';
import { Check, ChevronDown, ChevronsUpDown, ExternalLink, Info } from 'lucide-react-native';
import { Children, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Switch, View } from 'react-native';
import { match, P } from 'ts-pattern';
import { ArtifactChart } from '@/components/artifacts/artifact-chart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HtmlFrame } from '@/components/ui/html-frame';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle, ItemValue } from '@/components/ui/item';
import { Markdown } from '@/components/ui/markdown';
import { Menu } from '@/components/ui/menu';
import { StatusDot } from '@/components/ui/status-dot';
import { Tabs } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { ARTIFACTS } from '@/services/artifacts/artifacts.constants';
import type { StateStore } from '@json-render/core';
import type { ArtifactSpec } from '@repo/contracts/universal';

const { registry } = defineRegistry(defineCatalog(schema, { components: artifactComponents, actions: {} }), {
  components: {
    Stack: ({ props, children }) => (
      <View className={cn('min-w-0', props.direction === 'horizontal' ? 'flex-row flex-wrap items-start' : 'flex-col', ARTIFACTS.gaps[props.gap ?? 'md'])}>{children}</View>
    ),
    Grid: ({ children }) => <View className="gap-4">{children}</View>,
    Card: ({ props, children }) => (
      <Card>
        {props.title || props.description ? (
          <CardHeader>
            {props.title ? <CardTitle>{props.title}</CardTitle> : null}
            {props.description ? <CardDescription>{props.description}</CardDescription> : null}
          </CardHeader>
        ) : null}
        <CardContent>
          <View className="gap-4">{children}</View>
        </CardContent>
      </Card>
    ),
    Heading: ({ props }) => <Text accessibilityRole="header" variant={ARTIFACTS.headings[props.level ?? '2']}>{props.text}</Text>,
    Text: ({ props }) => <Text tone={props.variant === 'muted' ? 'muted' : 'default'}>{props.text}</Text>,
    Stat: ({ props }) => {
      const trendTone = match(props.trend).with('up', () => 'success' as const).with('down', () => 'destructive' as const).otherwise(() => 'muted' as const);

      return (
        <View className="min-w-0 gap-1">
          <Text tone="muted" variant="small">{props.label}</Text>
          <Text variant="title">{props.value}</Text>
          {props.change ? (
            <View className="flex-row items-center gap-1">
              {props.trend ? (
                <Icon
                  icon={ARTIFACTS.trendIcons[props.trend]}
                  size="sm"
                  tone={trendTone}
                />
              ) : null}
              <Text tone={trendTone} variant="small">{props.change}</Text>
            </View>
          ) : null}
          {props.hint ? <Text tone="muted" variant="small">{props.hint}</Text> : null}
        </View>
      );
    },
    Badge: ({ props }) => (
      <Badge className="self-start" variant={props.variant === 'secondary' ? 'default' : 'outline'}>
        <Text tone={props.variant === 'destructive' ? 'destructive' : undefined}>{props.text}</Text>
      </Badge>
    ),
    List: ({ props }) => (
      <ItemGroup>
        {props.items.map((item, index) => (
          <Item key={`${item.title}-${index}`} size="sm">
            <ItemContent>
              <ItemTitle
                accessibilityRole={item.url ? 'link' : undefined}
                tone={item.url ? 'primary' : undefined}
                onPress={item.url ? () => void Linking.openURL(item.url ?? '') : undefined}
              >{item.title}</ItemTitle>
              {item.description ? <ItemDescription>{item.description}</ItemDescription> : null}
            </ItemContent>
            {item.meta ? <ItemValue>{item.meta}</ItemValue> : null}
          </Item>
        ))}
      </ItemGroup>
    ),
    Table: ({ props }) => (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {[undefined, ...props.rows].map((row, index) => (
            <View className={cn('flex-row', index > 0 && 'border-t border-border')} key={index}>
              {props.columns.map((column) => (
                <Text
                  className={cn('m-2 w-28', column.align === 'right' && 'text-right')}
                  key={column.key}
                  tone={row ? undefined : 'muted'}
                  variant={row ? 'body' : 'label'}
                >{row ? String(row[column.key] ?? '') : column.label}</Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    ),
    Progress: ({ props }) => (
      <View className="gap-2">
        <View className="flex-row items-center justify-between gap-2">
          <Text>{props.label}</Text>
          <Text tone="muted">{`${props.value}%`}</Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-muted">
          <View className="h-full rounded-full bg-primary" style={{ width: `${Math.min(Math.max(props.value, 0), 100)}%` }} />
        </View>
        {props.hint ? <Text tone="muted" variant="small">{props.hint}</Text> : null}
      </View>
    ),
    Separator: () => <View className="h-px bg-border" />,
    LineChart: ({ props }) => <ArtifactChart chart={{ kind: 'line', ...props }} />,
    BarChart: ({ props }) => <ArtifactChart chart={{ kind: 'bar', ...props }} />,
    AreaChart: ({ props }) => <ArtifactChart chart={{ kind: 'area', ...props }} />,
    PieChart: ({ props }) => <ArtifactChart chart={{ kind: 'pie', ...props }} />,
    Checklist: ({ props, bindings }) => {
      const [items = [], setItems] = useBoundProp(props.items, bindings?.items);

      return (
        <ItemGroup>
          {items.map((item, index) => (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.done }}
              key={`${item.title}-${index}`}
              onPress={() => setItems(items.map((entry, position) => (position === index ? { ...entry, done: !entry.done } : entry)))}
            >
              <Item size="sm">
                <View className={cn('size-4 items-center justify-center rounded-sm border border-input', item.done && 'border-primary bg-primary')}>
                  {item.done ? (
                    <Icon
                      icon={Check}
                      size="sm"
                      tone="on-primary"
                    />
                  ) : null}
                </View>
                <ItemContent>
                  <ItemTitle tone={item.done ? 'muted' : undefined}>{item.title}</ItemTitle>
                  {item.description ? <ItemDescription>{item.description}</ItemDescription> : null}
                </ItemContent>
              </Item>
            </Pressable>
          ))}
        </ItemGroup>
      );
    },
    Toggle: ({ props, bindings }) => {
      const [checked = false, setChecked] = useBoundProp(props.checked, bindings?.checked);

      return (
        <ItemGroup>
          <Item size="sm">
            <ItemContent>
              <ItemTitle>{props.label}</ItemTitle>
              {props.description ? <ItemDescription>{props.description}</ItemDescription> : null}
            </ItemContent>
            <Switch
              accessibilityLabel={props.label}
              value={checked}
              onValueChange={setChecked}
            />
          </Item>
        </ItemGroup>
      );
    },
    Tabs: ({ props, children }) => {
      const [tab, setTab] = useState('0');

      return (
        <View className="gap-3">
          <Tabs
            options={props.tabs.map((label, index) => ({ value: String(index), label }))}
            value={tab}
            onValueChange={setTab}
          />
          <View className="gap-4">{Children.toArray(children)[Number(tab)]}</View>
        </View>
      );
    },
    Section: ({ props, children }) => {
      const [isOpen, setIsOpen] = useState(props.open ?? true);

      return (
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: isOpen }}
            className="flex-row items-center gap-1 self-start py-1"
            onPress={() => setIsOpen(!isOpen)}
          >
            <Text tone="muted" variant="button">{props.title}</Text>
            <Icon
              className={cn(isOpen && 'rotate-180')}
              icon={ChevronDown}
              tone="muted"
            />
          </Pressable>
          {isOpen ? <View className="gap-4 pt-3">{children}</View> : null}
        </View>
      );
    },
    Markdown: ({ props }) => <Markdown selectable>{props.text}</Markdown>,
    KeyValue: ({ props }) => (
      <ItemGroup>
        {props.items.map((item, index) => (
          <Item key={`${item.label}-${index}`} size="sm">
            <ItemContent>
              <ItemDescription>{item.label}</ItemDescription>
            </ItemContent>
            <ItemTitle>{String(item.value)}</ItemTitle>
          </Item>
        ))}
      </ItemGroup>
    ),
    Status: ({ props }) => (
      <View className="flex-row items-start gap-2">
        <View className="h-5 justify-center">
          <StatusDot label={props.label} variant={props.state} />
        </View>
        <View className="min-w-0 flex-1">
          <Text variant="label">{props.label}</Text>
          {props.description ? <Text tone="muted" variant="small">{props.description}</Text> : null}
        </View>
      </View>
    ),
    Alert: ({ props }) => (
      <Alert variant={props.variant ?? 'default'}>
        <View className="flex-row gap-2">
          <Icon icon={Info} />
          <View className="flex-1 gap-1">
            <AlertTitle>{props.title}</AlertTitle>
            {props.description ? <AlertDescription>{props.description}</AlertDescription> : null}
          </View>
        </View>
      </Alert>
    ),
    LinkButton: ({ props }) => (
      <Button
        accessibilityRole="link"
        className="self-start"
        size="sm"
        variant="outline"
        onPress={() => void Linking.openURL(props.url)}
      >
        <Text variant="button">{props.label}</Text>
        <Icon icon={ExternalLink} />
      </Button>
    ),
    Image: ({ props }) => (
      <View className="gap-2">
        <Image
          accessibilityLabel={props.alt}
          className="h-56 w-full rounded-xl"
          resizeMode="cover"
          source={{ uri: props.url }}
        />
        {props.caption ? <Text tone="muted" variant="small">{props.caption}</Text> : null}
      </View>
    ),
    Select: ({ props, bindings }) => {
      const [value, setValue] = useBoundProp(props.value, bindings?.value);

      return (
        <View className="gap-2">
          <Text variant="label">{props.label}</Text>
          <Menu
            isFullWidth
            items={props.options.map((option) => ({
              label: option.label,
              systemImage: option.value === value ? 'checkmark' : undefined,
              onSelect: () => setValue(option.value),
            }))}
            title={props.label}
          >
            <View className="h-10 flex-row items-center justify-between rounded-lg border border-input px-3">
              <Text>{props.options.find((option) => option.value === value)?.label ?? ''}</Text>
              <Icon icon={ChevronsUpDown} tone="muted" />
            </View>
          </Menu>
        </View>
      );
    },
    Notes: ({ props, bindings }) => {
      const [value = '', setValue] = useBoundProp(props.value, bindings?.value);

      return (
        <View className="gap-2">
          {props.label ? <Text variant="label">{props.label}</Text> : null}
          <Input
            multiline
            accessibilityLabel={props.label}
            defaultValue={value}
            key={value}
            placeholder={props.placeholder}
            onEndEditing={(event) => event.nativeEvent.text !== value && setValue(event.nativeEvent.text)}
          />
        </View>
      );
    },
  },
});

interface ArtifactViewProps {
  spec: ArtifactSpec;
  store: StateStore;
  title: string;
}

export function ArtifactView({ spec, store, title }: ArtifactViewProps) {
  return match(spec)
    .with({ html: P.string }, ({ html }) => (
      <View className="flex-1 px-4">
        <HtmlFrame
          fill
          isUnderHeader
          html={html}
          key={html}
          title={title}
        />
      </View>
    ))
    .otherwise((structured) => (
      <ScrollView contentContainerClassName="gap-6 px-4 pt-4 pb-12" contentInsetAdjustmentBehavior="automatic">
        <JSONUIProvider
          key={JSON.stringify(structured.elements)}
          registry={registry}
          store={store}
        >
          <Renderer registry={registry} spec={structured} />
        </JSONUIProvider>
      </ScrollView>
    ));
}
