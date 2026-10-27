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
        'tabs': { type: 'Tabs', props: { tabs: ['Lists', 'Data', 'Inputs'] }, children: ['tab-lists', 'tab-data', 'tab-inputs'] },
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
