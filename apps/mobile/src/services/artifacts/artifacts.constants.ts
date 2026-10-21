import { Minus, TrendingDown, TrendingUp } from 'lucide-react-native';

export const ARTIFACTS = {
  chartOpacities: [1, 0.7, 0.48, 0.32, 0.2, 0.12],
  chartHeight: 224,
  trendIcons: { up: TrendingUp, down: TrendingDown, flat: Minus },
  gaps: { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' },
  headings: { '1': 'heading', '2': 'card-title', '3': 'item-title' },
} as const;
