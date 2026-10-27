import { LAB_CHAT } from './lab.constants';
import type * as UniversalTypes from '@repo/contracts/universal';

export function labArtifacts(botId: string, createdAt: number): UniversalTypes.Artifact[] {
  const blocks: UniversalTypes.Artifact = {
    id: LAB_CHAT.ids.blocks,
    botId,
    conversationId: 1,
    title: 'Every artifact block',
    emoji: '🧩',
    version: 1,
    createdAt,
    updatedAt: createdAt,
    spec: {
      root: 'root',
      state: {},
      elements: {
        'root': { type: 'Stack', props: { gap: 'md' }, children: ['h1', 'intro', 'tabs', 'separator', 'h2', 'grid', 'section'] },
        'h1': { type: 'Heading', props: { text: 'Heading level 1', level: '1' }, children: [] },
        'intro': { type: 'Text', props: { text: 'Body text in an artifact reads like a chat bubble: small, regular weight and easy to scan.' }, children: [] },
        'tabs': { type: 'Tabs', props: { tabs: ['Charts', 'Lists', 'Data', 'Inputs'] }, children: ['tab-charts', 'tab-lists', 'tab-data', 'tab-inputs'] },
        'tab-charts': { type: 'Stack', props: { gap: 'md' }, children: ['metrics', 'trend', 'minutes', 'sources', 'health-row', 'storage', 'activity'] },
        'metrics': { type: 'Grid', props: { columns: '2' }, children: ['metric-users', 'metric-uptime'] },
        'metric-users': { type: 'Metric', props: { label: 'Weekly active users', value: 2486, change: '+18.4%', context: 'Compared with the last 7 days' }, children: [] },
        'metric-uptime': { type: 'Metric', props: { label: 'Uptime', value: 99.98, suffix: '%', change: '-0.01%', context: 'Last 30 days' }, children: [] },
        'trend': {
          type: 'LineChart',
          props: {
            title: 'Trial signups',
            caption: 'Total signups',
            value: '6,670',
            change: '+20.6% vs previous 30 days',
            x: 'day',
            series: [{ key: 'current', label: 'This period' }, { key: 'previous', label: 'Previous period' }],
            data: Array.from({ length: 30 }, (_, index) => ({
              day: `Sep ${index + 1}`,
              current: Math.round(200 + 60 * Math.sin(index / 3) + (index === 16 ? 210 : 0) + index * 2),
              previous: Math.round(180 + 40 * Math.sin(index / 3 + 0.4) + index),
            })),
          },
          children: [],
        },
        'minutes': {
          type: 'BarChart',
          props: {
            title: 'Active minutes',
            caption: 'Daily average',
            value: '49',
            unit: 'min',
            average: true,
            x: 'day',
            series: [{ key: 'minutes', label: 'Minutes' }],
            data: [{ day: 'T', minutes: 38 }, { day: 'W', minutes: 52 }, { day: 'T', minutes: 21 }, { day: 'F', minutes: 34 }, { day: 'S', minutes: 81 }, { day: 'S', minutes: 66 }, { day: 'M', minutes: 14 }],
          },
          children: [],
        },
        'sources': {
          type: 'PieChart',
          props: {
            title: 'Visits by source',
            centerLabel: 'Visits',
            data: [{ label: 'Search', value: 16840 }, { label: 'Direct', value: 8120 }, { label: 'Referrals', value: 6430 }, { label: 'Newsletter', value: 5260 }, { label: 'Social', value: 2910 }, { label: 'Other', value: 1050 }],
          },
          children: [],
        },
        'health-row': { type: 'Grid', props: { columns: '2' }, children: ['health', 'daily'] },
        'health': { type: 'Gauge', props: { value: 72, status: 'Healthy', label: 'Workspace health', description: '14 of 20 checks passing', tone: 'success' }, children: [] },
        'daily': { type: 'Sparkline', props: { label: 'Daily active users', value: '2,486', change: '+7.2%', data: [1810, 1920, 2104, 2050, 1980, 2210, 2302, 2190, 2360, 2486] }, children: [] },
        'storage': {
          type: 'UsageMeter',
          props: {
            title: 'Storage',
            used: 12.4,
            total: 15,
            unit: 'GB',
            parts: [{ label: 'Documents', value: 4.2 }, { label: 'Photos', value: 5.1 }, { label: 'Backups', value: 3.1 }],
          },
          children: [],
        },
        'activity': {
          type: 'Heatmap',
          props: {
            title: 'Commits',
            days: Array.from({ length: 182 }, (_, index) => ({
              date: new Date(Date.UTC(2026, 3, 1) + index * 86_400_000).toISOString().slice(0, 10),
              value: (index * 7 + (index % 5) * 3) % 9 > 3 ? (index * 13) % 7 : 0,
            })),
          },
          children: [],
        },
        'tab-lists': { type: 'Stack', props: { gap: 'md' }, children: ['list', 'key-value', 'checklist', 'toggle'] },
        'list': {
          type: 'List',
          props: {
            items: [
              { title: 'Launch post', description: 'Published on the blog and shared on X.', meta: 'Mon' },
              { title: 'Changelog', description: 'Draft with the onboarding changes.', meta: 'Tue', url: 'https://example.com/changelog' },
              { title: 'Pricing page', meta: 'Fri' },
            ],
          },
          children: [],
        },
        'key-value': { type: 'KeyValue', props: { items: [{ label: 'Plan', value: 'Pro' }, { label: 'Seats', value: 12 }, { label: 'Renews', value: '1 Nov' }] }, children: [] },
        'checklist': {
          type: 'Checklist',
          props: {
            items: [
              { title: 'Recap drafted', done: true },
              { title: 'Revenue split from Ledger', description: 'Waiting on the October export.', done: false },
              { title: 'Day-7 retention check', done: false },
            ],
          },
          children: [],
        },
        'toggle': { type: 'Toggle', props: { label: 'Email the recap on Fridays', description: 'Sends to the launch list at 17:00.', checked: true }, children: [] },
        'tab-data': { type: 'Stack', props: { gap: 'md' }, children: ['table', 'progress', 'bars', 'pie'] },
        'table': {
          type: 'Table',
          props: {
            columns: [{ key: 'channel', label: 'Channel' }, { key: 'signups', label: 'Signups', align: 'right' }, { key: 'rate', label: 'Activation', align: 'right' }],
            rows: [
              { channel: 'Organic', signups: 812, rate: '52%' },
              { channel: 'Product Hunt', signups: 433, rate: '47%' },
              { channel: 'Referral', signups: 294, rate: '44%' },
            ],
          },
          children: [],
        },
        'progress': { type: 'Progress', props: { label: 'Launch checklist', value: 68, hint: '17 of 25 tasks done' }, children: [] },
        'bars': {
          type: 'BarChart',
          props: {
            x: 'day',
            series: [{ key: 'signups', label: 'Signups' }],
            data: [{ day: 'Mon', signups: 142 }, { day: 'Tue', signups: 188 }, { day: 'Wed', signups: 171 }, { day: 'Thu', signups: 230 }, { day: 'Fri', signups: 214 }],
          },
          children: [],
        },
        'pie': { type: 'PieChart', props: { data: [{ label: 'Organic', value: 812 }, { label: 'Product Hunt', value: 433 }, { label: 'Referral', value: 294 }] }, children: [] },
        'tab-inputs': { type: 'Stack', props: { gap: 'md' }, children: ['select', 'notes', 'link'] },
        'select': { type: 'Select', props: { label: 'Range', value: '7d', options: [{ value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }] }, children: [] },
        'notes': { type: 'Notes', props: { label: 'Notes', placeholder: 'Write a note for the team', value: '' }, children: [] },
        'link': { type: 'LinkButton', props: { label: 'Open the analytics', url: 'https://example.com/analytics' }, children: [] },
        'separator': { type: 'Separator', props: {}, children: [] },
        'h2': { type: 'Heading', props: { text: 'Heading level 2', level: '2' }, children: [] },
        'grid': { type: 'Grid', props: { columns: '2' }, children: ['card', 'card-plain'] },
        'card': { type: 'Card', props: { title: 'Card with a title', description: 'A short description under the title.' }, children: ['stat', 'badges', 'status'] },
        'stat': { type: 'Stat', props: { label: 'Signups', value: '1,539', change: '+38%', trend: 'up', hint: 'Since Monday' }, children: [] },
        'badges': { type: 'Stack', props: { direction: 'horizontal', gap: 'sm' }, children: ['badge', 'badge-outline', 'badge-destructive'] },
        'badge': { type: 'Badge', props: { text: 'Secondary' }, children: [] },
        'badge-outline': { type: 'Badge', props: { text: 'Outline', variant: 'outline' }, children: [] },
        'badge-destructive': { type: 'Badge', props: { text: 'Destructive', variant: 'destructive' }, children: [] },
        'status': { type: 'Status', props: { label: 'Pairing service', state: 'success', description: 'All devices connected.' }, children: [] },
        'card-plain': { type: 'Card', props: {}, children: ['h3', 'muted', 'alert', 'alert-destructive'] },
        'h3': { type: 'Heading', props: { text: 'Heading level 3', level: '3' }, children: [] },
        'muted': { type: 'Text', props: { text: 'Muted text for secondary details.', variant: 'muted' }, children: [] },
        'alert': { type: 'Alert', props: { title: 'Heads up', description: 'The weekly export runs at 06:00.' }, children: [] },
        'alert-destructive': { type: 'Alert', props: { title: 'Pairing failed for 12 devices', description: 'They returned 403 since Thursday.', variant: 'destructive' }, children: [] },
        'section': { type: 'Section', props: { title: 'More details' }, children: ['markdown', 'image', 'line'] },
        'markdown': { type: 'Markdown', props: { text: 'Markdown with **bold**, `code` and a [link](https://example.com).\n\n- First point\n- Second point' }, children: [] },
        'image': { type: 'Image', props: { url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200', alt: 'A dashboard on a laptop', caption: 'Images get the card radius.' }, children: [] },
        'line': {
          type: 'LineChart',
          props: {
            x: 'day',
            series: [{ key: 'signups', label: 'Signups' }, { key: 'activated', label: 'Activated' }],
            data: [{ day: 'Mon', signups: 142, activated: 61 }, { day: 'Tue', signups: 188, activated: 84 }, { day: 'Wed', signups: 171, activated: 79 }, { day: 'Thu', signups: 230, activated: 112 }],
          },
          children: [],
        },
      },
    },
  };

  const page: UniversalTypes.Artifact = {
    id: LAB_CHAT.ids.page,
    botId,
    conversationId: 1,
    title: 'Launch status page',
    emoji: '🚀',
    version: 1,
    createdAt,
    updatedAt: createdAt,
    spec: { html: LAB_CHAT.page, state: {} },
  };

  return [blocks, page];
}
