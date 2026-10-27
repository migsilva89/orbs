import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';
import { Text } from '@/components/ui/text';
import { ARTIFACTS } from '@/services/artifacts/artifacts.constants';
import type { ArtifactsChart } from '@repo/client/client';

interface ArtifactChartHeaderProps {
  title?: string;
  value?: string;
  change?: string;
  caption?: string;
}

function ArtifactChartHeader({ title, value, change, caption }: ArtifactChartHeaderProps) {
  return title || value || change || caption ? (
    <View className="gap-1">
      {title ? <Text variant="label">{title}</Text> : null}
      {caption ? <Text tone="muted" variant="small">{caption}</Text> : null}
      {value ? <Text variant="title">{value}</Text> : null}
      {change ? <Text tone="muted" variant="small">{change}</Text> : null}
    </View>
  ) : null;
}

interface ArtifactChartProps {
  chart: ArtifactsChart;
}

export function ArtifactChart({ chart }: ArtifactChartProps) {
  const [width, setWidth] = useState(0);
  const [foreground, border] = useCSSVariable(['--color-foreground', '--color-border']).map(String);

  if (chart.kind === 'pie') {
    return (
      <View className="gap-3">
        <ArtifactChartHeader caption={chart.caption} title={chart.title} />
        <View className="items-center">
          <ArtifactChartPie data={chart.data} foreground={foreground} />
        </View>
        <ArtifactChartLegend foreground={foreground} labels={chart.data.map((slice) => `${slice.label} · ${slice.value}`)} />
      </View>
    );
  }

  const { kind, data, x, series } = chart;
  const values = data.flatMap((row) => series.map((item) => Number(row[item.key] ?? 0)));
  const min = kind === 'bar' ? 0 : Math.min(...values);
  const max = Math.max(...values, min + 1);
  const height = ARTIFACTS.chartHeight;
  const slot = width / Math.max(data.length, 1);
  const pointX = (index: number) => (kind === 'bar' ? slot * index + slot / 2 : (width * index) / Math.max(data.length - 1, 1));
  const pointY = (value: number) => height - ((value - min) / (max - min)) * height;
  const barWidth = Math.max(slot * 0.7 / series.length, 1);

  return (
    <View className="gap-3">
      <ArtifactChartHeader
        caption={chart.caption}
        change={chart.change}
        title={chart.title}
        value={chart.value}
      />
      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        <Svg height={height} width={width}>
          {[0.25, 0.5, 0.75].map((line) => (
            <Line
              key={line}
              stroke={border}
              x1={0}
              x2={width}
              y1={height * line}
              y2={height * line}
            />
          ))}
          {series.map((item, position) => {
            const opacity = ARTIFACTS.chartOpacities[position];
            const points = data.map((row, index) => `${pointX(index)},${pointY(Number(row[item.key] ?? 0))}`);

            if (kind === 'bar') {
              return data.map((row, index) => {
                const top = pointY(Number(row[item.key] ?? 0));

                return (
                  <Rect
                    fill={foreground}
                    fillOpacity={opacity}
                    height={height - top}
                    key={`${item.key}-${index}`}
                    rx={4}
                    width={barWidth}
                    x={pointX(index) - (barWidth * series.length) / 2 + barWidth * position}
                    y={top}
                  />
                );
              });
            }

            return (
              <Path
                d={kind === 'area' ? `M0,${height} L${points.join(' L')} L${width},${height} Z` : `M${points.join(' L')}`}
                fill={kind === 'area' ? foreground : 'none'}
                fillOpacity={kind === 'area' ? 0.2 * opacity : 0}
                key={item.key}
                stroke={foreground}
                strokeOpacity={opacity}
                strokeWidth={2}
              />
            );
          })}
        </Svg>
      </View>
      <View className="flex-row justify-between">
        <Text tone="muted" variant="small">{String(data[0]?.[x] ?? '')}</Text>
        <Text tone="muted" variant="small">{String(data.at(-1)?.[x] ?? '')}</Text>
      </View>
      {series.length > 1 ? <ArtifactChartLegend foreground={foreground} labels={series.map((item) => item.label)} /> : null}
    </View>
  );
}

interface ArtifactChartPieProps {
  data: { label: string; value: number }[];
  foreground: string;
}

function ArtifactChartPie({ data, foreground }: ArtifactChartPieProps) {
  const size = ARTIFACTS.chartHeight;
  const radius = size / 2;
  const inner = radius * 0.55;
  const total = data.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const point = (angle: number, length: number) => `${radius + Math.cos(angle) * length},${radius + Math.sin(angle) * length}`;

  const arcs = data.map((slice, index) => {
    const before = data.slice(0, index).reduce((sum, item) => sum + item.value, 0);
    const start = -Math.PI / 2 + (before / total) * Math.PI * 2;
    const end = start + (slice.value / total) * Math.PI * 2 - 0.0001;
    const isLarge = end - start > Math.PI ? 1 : 0;

    return `M${point(start, radius)} A${radius},${radius} 0 ${isLarge} 1 ${point(end, radius)} L${point(end, inner)} A${inner},${inner} 0 ${isLarge} 0 ${point(start, inner)} Z`;
  });

  return (
    <Svg height={size} width={size}>
      {arcs.map((path, index) => (
        <Path
          d={path}
          fill={foreground}
          fillOpacity={ARTIFACTS.chartOpacities[index]}
          key={data[index]?.label ?? index}
        />
      ))}
    </Svg>
  );
}

interface ArtifactChartLegendProps {
  labels: string[];
  foreground: string;
}

function ArtifactChartLegend({ labels, foreground }: ArtifactChartLegendProps) {
  return (
    <View className="flex-row flex-wrap justify-center gap-x-4 gap-y-1">
      {labels.map((label, index) => (
        <View className="flex-row items-center gap-1.5" key={label}>
          <View className="size-2 rounded-xs" style={{ backgroundColor: foreground, opacity: ARTIFACTS.chartOpacities[index] }} />
          <Text tone="muted" variant="small">{label}</Text>
        </View>
      ))}
    </View>
  );
}
