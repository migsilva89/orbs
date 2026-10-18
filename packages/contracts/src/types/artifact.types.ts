import { z } from 'zod';
import { conversationTarget } from './conversation.types';

export const ARTIFACT = {
  docKind: 'openbots.artifacts',
  contentKind: 'openbots.artifact-content',
  entryKind: 'openbots.artifact-version',
  listLimit: 100,
  versionsKept: 10,
  specBytesMax: 200_000,
  titleMax: 120,
  depthMax: 32,
} as const;

const artifactLink = z.url({ protocol: /^https?$/ });
const artifactCell = z.union([z.string(), z.number(), z.null()]);

export const artifactComponents = {
  Stack: {
    props: z.object({
      direction: z.enum(['vertical', 'horizontal']).optional(),
      gap: z.enum(['sm', 'md', 'lg']).optional(),
    }),
    description: 'ui_artifact_block_stack_description',
  },
  Grid: {
    props: z.object({ columns: z.enum(['1', '2', '3', '4']).optional() }),
    description: 'ui_artifact_block_grid_description',
  },
  Card: {
    props: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
    }),
    description: 'ui_artifact_block_card_description',
  },
  Heading: {
    props: z.object({
      text: z.string(),
      level: z.enum(['1', '2', '3']).optional(),
    }),
    description: 'ui_artifact_block_heading_description',
  },
  Text: {
    props: z.object({
      text: z.string(),
      variant: z.enum(['default', 'muted']).optional(),
    }),
    description: 'ui_artifact_block_text_description',
  },
  Stat: {
    props: z.object({
      label: z.string(),
      value: z.union([z.string(), z.number()]),
      change: z.string().optional(),
      trend: z.enum(['up', 'down', 'flat']).optional(),
      hint: z.string().optional(),
    }),
    description: 'ui_artifact_block_stat_description',
  },
  Badge: {
    props: z.object({
      text: z.string(),
      variant: z.enum(['secondary', 'outline', 'destructive']).optional(),
    }),
    description: 'ui_artifact_block_badge_description',
  },
  List: {
    props: z.object({
      items: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        meta: z.string().optional(),
        url: artifactLink.optional(),
      })).max(200),
    }),
    description: 'ui_artifact_block_list_description',
  },
  Table: {
    props: z.object({
      columns: z.array(z.object({
        key: z.string(),
        label: z.string(),
        align: z.enum(['left', 'right']).optional(),
      })).min(1).max(12),
      rows: z.array(z.record(z.string(), artifactCell)).max(500),
    }),
    description: 'ui_artifact_block_table_description',
  },
  Progress: {
    props: z.object({
      label: z.string(),
      value: z.number().min(0).max(100),
      hint: z.string().optional(),
    }),
    description: 'ui_artifact_block_progress_description',
  },
  Separator: {
    props: z.object({}),
    description: 'ui_artifact_block_separator_description',
  },
  LineChart: {
    props: z.object({
      data: z.array(z.record(z.string(), artifactCell)).max(500),
      x: z.string(),
      series: z.array(z.object({ key: z.string(), label: z.string() })).min(1).max(4),
    }),
    description: 'ui_artifact_block_line_chart_description',
  },
  BarChart: {
    props: z.object({
      data: z.array(z.record(z.string(), artifactCell)).max(500),
      x: z.string(),
      series: z.array(z.object({ key: z.string(), label: z.string() })).min(1).max(4),
    }),
    description: 'ui_artifact_block_bar_chart_description',
  },
  Checklist: {
    props: z.object({
      items: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        done: z.boolean(),
      })).max(200),
    }),
    description: 'ui_artifact_block_checklist_description',
  },
  Toggle: {
    props: z.object({
      label: z.string(),
      description: z.string().optional(),
      checked: z.boolean(),
    }),
    description: 'ui_artifact_block_toggle_description',
  },
  Tabs: {
    props: z.object({ tabs: z.array(z.string()).min(2).max(4) }),
    description: 'ui_artifact_block_tabs_description',
  },
  Section: {
    props: z.object({
      title: z.string(),
      open: z.boolean().optional(),
    }),
    description: 'ui_artifact_block_section_description',
  },
  Markdown: {
    props: z.object({ text: z.string().max(20_000) }),
    description: 'ui_artifact_block_markdown_description',
  },
  KeyValue: {
    props: z.object({
      items: z.array(z.object({ label: z.string(), value: z.union([z.string(), z.number()]) })).max(50),
    }),
    description: 'ui_artifact_block_key_value_description',
  },
  Status: {
    props: z.object({
      label: z.string(),
      state: z.enum(['default', 'success', 'destructive']),
      description: z.string().optional(),
    }),
    description: 'ui_artifact_block_status_description',
  },
  Alert: {
    props: z.object({
      title: z.string(),
      description: z.string().optional(),
      variant: z.enum(['default', 'destructive']).optional(),
    }),
    description: 'ui_artifact_block_alert_description',
  },
  LinkButton: {
    props: z.object({ label: z.string(), url: artifactLink }),
    description: 'ui_artifact_block_link_button_description',
  },
  Image: {
    props: z.object({
      url: artifactLink,
      alt: z.string(),
      caption: z.string().optional(),
    }),
    description: 'ui_artifact_block_image_description',
  },
  AreaChart: {
    props: z.object({
      data: z.array(z.record(z.string(), artifactCell)).max(500),
      x: z.string(),
      series: z.array(z.object({ key: z.string(), label: z.string() })).min(1).max(4),
    }),
    description: 'ui_artifact_block_area_chart_description',
  },
  PieChart: {
    props: z.object({
      data: z.array(z.object({ label: z.string(), value: z.number().nonnegative() })).min(1).max(6),
    }),
    description: 'ui_artifact_block_pie_chart_description',
  },
  Select: {
    props: z.object({
      label: z.string(),
      options: z.array(z.object({ value: z.string(), label: z.string() })).min(2).max(20),
      value: z.string(),
    }),
    description: 'ui_artifact_block_select_description',
  },
  Notes: {
    props: z.object({
      label: z.string().optional(),
      placeholder: z.string().optional(),
      value: z.string().max(5000),
    }),
    description: 'ui_artifact_block_notes_description',
  },
} as const;

export type ArtifactBlockName = keyof typeof artifactComponents;

const artifactTitle = z.string().trim().min(1).max(ARTIFACT.titleMax);
const artifactState = z.record(z.string(), z.json());

export const artifactSpec = z.object({
  root: z.string().min(1),
  elements: z.record(z.string().min(1), z.object({
    type: z.string().min(1),
    props: z.record(z.string(), z.json()).default({}),
    children: z.array(z.string()).default([]),
  })),
  state: artifactState.default({}),
});

export const artifactSummary = z.object({
  id: z.uuid(),
  botId: z.uuid(),
  conversationId: z.number().int().positive(),
  title: artifactTitle,
  version: z.number().int().positive(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

export const artifact = artifactSummary.extend({ spec: artifactSpec });
export const artifactList = z.array(artifactSummary);

export const artifactVersion = z.object({
  version: z.number().int().positive(),
  createdAt: z.number().int(),
});

export const artifactVersionList = z.array(artifactVersion);

export const artifactListInput = conversationTarget;

export const artifactGet = conversationTarget.extend({
  artifactId: z.uuid(),
  version: z.number().int().positive().optional(),
});

export const artifactCreate = conversationTarget.extend({
  title: artifactTitle,
  spec: artifactSpec,
});

export const artifactUpdateFields = conversationTarget.extend({
  artifactId: z.uuid(),
  version: z.number().int().positive(),
  title: artifactTitle.optional(),
  spec: artifactSpec.optional(),
  state: artifactState.optional(),
});

export const artifactUpdate = artifactUpdateFields.refine((value) => (
  value.title !== undefined || value.spec !== undefined || value.state !== undefined
));

export const artifactSaveState = conversationTarget.extend({
  artifactId: z.uuid(),
  version: z.number().int().positive(),
  state: artifactState,
});

export const artifactRestore = conversationTarget.extend({
  artifactId: z.uuid(),
  version: z.number().int().positive(),
  fromVersion: z.number().int().positive(),
});

export const artifactVersionsInput = conversationTarget.extend({ artifactId: z.uuid() });

export const artifactBlocks = z.record(z.string(), z.object({
  description: z.string(),
  props: z.record(z.string(), z.json()),
}));

export type ArtifactSpec = z.infer<typeof artifactSpec>;
export type ArtifactSummary = z.infer<typeof artifactSummary>;
export type Artifact = z.infer<typeof artifact>;
export type ArtifactVersion = z.infer<typeof artifactVersion>;
export type ArtifactListInput = z.infer<typeof artifactListInput>;
export type ArtifactGetInput = z.infer<typeof artifactGet>;
export type ArtifactCreateInput = z.infer<typeof artifactCreate>;
export type ArtifactUpdateInput = z.infer<typeof artifactUpdate>;
export type ArtifactSaveStateInput = z.infer<typeof artifactSaveState>;
export type ArtifactRestoreInput = z.infer<typeof artifactRestore>;
export type ArtifactVersionsInput = z.infer<typeof artifactVersionsInput>;
export type ArtifactBlocks = z.infer<typeof artifactBlocks>;
