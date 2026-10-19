import { createContext, use } from 'react';
import { ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/cn';
import type { ComponentProps, ReactNode } from 'react';
import type { TooltipContentProps, TooltipValueType } from 'recharts';

type ChartConfig = Record<string, { label: ReactNode }>;

const ChartContext = createContext<{ config: ChartConfig }>({ config: {} });

function ChartContainer({ className, children, config, ...props }: ComponentProps<'div'> & {
  config: ChartConfig
  children: ComponentProps<typeof ResponsiveContainer>['children']
}) {
  return (
    <ChartContext value={{ config }}>
      <div
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-surface]:outline-hidden",
          className,
        )}
        data-slot="chart"
        {...props}
      >
        <ResponsiveContainer initialDimension={{ width: 320, height: 200 }}>{children}</ResponsiveContainer>
      </div>
    </ChartContext>
  );
}

function ChartTooltipContent({ active, payload, label }: Partial<TooltipContentProps<TooltipValueType, string>>) {
  const { config } = use(ChartContext);

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-sm">
      <div className="font-medium">{label}</div>
      <div className="grid gap-1.5">
        {payload.map((item) => (
          <div className="flex w-full items-center gap-2" key={String(item.dataKey)}>
            <span className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
            <span className="flex-1 text-muted-foreground">{config[String(item.dataKey)]?.label ?? item.name}</span>
            <span className="font-mono font-medium text-foreground tabular-nums">{item.value?.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartLegendItems({ items }: { items: { label: ReactNode; color: string }[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground" data-slot="chart-legend">
      {items.map((item, index) => (
        <li className="flex items-center gap-1.5" key={index}>
          <span className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export { ChartContainer, ChartLegendItems, ChartTooltipContent };
