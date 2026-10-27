import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartLegendItems, ChartTooltipContent } from '@/components/ui/chart';
import { ARTIFACTS } from '@/services/artifacts/artifacts.constants';
import type { ArtifactsChart } from '@repo/client/client';

interface ArtifactChartProps {
  chart: ArtifactsChart
}

export function ArtifactChart({ chart }: ArtifactChartProps) {
  if (chart.kind === 'pie') {
    return (
      <div className="flex flex-col gap-3">
        <ChartContainer className="mx-auto aspect-square h-56" config={{}}>
          <PieChart>
            <Tooltip content={<ChartTooltipContent />} />
            <Pie
              data={chart.data}
              dataKey="value"
              innerRadius="55%"
              nameKey="label"
              strokeWidth={2}
            >
              {chart.data.map((slice, index) => (
                <Cell
                  fill={ARTIFACTS.chartColors[index]}
                  key={slice.label}
                  stroke="var(--background)"
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <ChartLegendItems items={chart.data.map((slice, index) => ({ label: `${slice.label} · ${slice.value}`, color: ARTIFACTS.chartColors[index] }))} />
      </div>
    );
  }

  const { kind, data, x, series } = chart;
  const Chart = { line: LineChart, area: AreaChart, bar: BarChart }[kind];

  return (
    <div className="flex flex-col gap-3">
      <ChartContainer className="aspect-auto h-56 w-full" config={Object.fromEntries(series.map((item) => [item.key, { label: item.label }]))}>
        <Chart accessibilityLayer data={data}>
          <CartesianGrid vertical={false} />
          <XAxis
            axisLine={false}
            dataKey={x}
            interval="preserveStartEnd"
            tickLine={false}
            tickMargin={8}
          />
          <YAxis hide domain={kind === 'bar' ? [0, 'auto'] : ['auto', 'auto']} />
          <Tooltip content={<ChartTooltipContent />} />
          {series.map((item, index) => {
            const color = ARTIFACTS.chartColors[index];

            if (kind === 'bar') {
              return (
                <Bar
                  dataKey={item.key}
                  fill={color}
                  key={item.key}
                  maxBarSize={40}
                  radius={6}
                />
              );
            }

            if (kind === 'area') {
              return (
                <Area
                  dataKey={item.key}
                  fill={color}
                  fillOpacity={0.2}
                  key={item.key}
                  stroke={color}
                  strokeWidth={2}
                  type="monotone"
                />
              );
            }

            return (
              <Line
                dataKey={item.key}
                dot={false}
                key={item.key}
                stroke={color}
                strokeWidth={2}
                type="monotone"
              />
            );
          })}
        </Chart>
      </ChartContainer>
      {series.length > 1 ? <ChartLegendItems items={series.map((item, index) => ({ label: item.label, color: ARTIFACTS.chartColors[index] }))} /> : null}
    </div>
  );
}
