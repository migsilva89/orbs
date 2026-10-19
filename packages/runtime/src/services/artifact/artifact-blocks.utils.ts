import { artifactBlocks, artifactComponents } from '@openbots/contracts/universal';
import * as m from '@openbots/i18n/messages';
import { z } from 'zod';

const descriptions = {
  ui_artifact_block_stack_description: m.ui_artifact_block_stack_description,
  ui_artifact_block_grid_description: m.ui_artifact_block_grid_description,
  ui_artifact_block_card_description: m.ui_artifact_block_card_description,
  ui_artifact_block_heading_description: m.ui_artifact_block_heading_description,
  ui_artifact_block_text_description: m.ui_artifact_block_text_description,
  ui_artifact_block_stat_description: m.ui_artifact_block_stat_description,
  ui_artifact_block_badge_description: m.ui_artifact_block_badge_description,
  ui_artifact_block_list_description: m.ui_artifact_block_list_description,
  ui_artifact_block_table_description: m.ui_artifact_block_table_description,
  ui_artifact_block_progress_description: m.ui_artifact_block_progress_description,
  ui_artifact_block_separator_description: m.ui_artifact_block_separator_description,
  ui_artifact_block_line_chart_description: m.ui_artifact_block_line_chart_description,
  ui_artifact_block_bar_chart_description: m.ui_artifact_block_bar_chart_description,
  ui_artifact_block_checklist_description: m.ui_artifact_block_checklist_description,
  ui_artifact_block_toggle_description: m.ui_artifact_block_toggle_description,
  ui_artifact_block_tabs_description: m.ui_artifact_block_tabs_description,
  ui_artifact_block_section_description: m.ui_artifact_block_section_description,
  ui_artifact_block_markdown_description: m.ui_artifact_block_markdown_description,
  ui_artifact_block_key_value_description: m.ui_artifact_block_key_value_description,
  ui_artifact_block_status_description: m.ui_artifact_block_status_description,
  ui_artifact_block_alert_description: m.ui_artifact_block_alert_description,
  ui_artifact_block_link_button_description: m.ui_artifact_block_link_button_description,
  ui_artifact_block_image_description: m.ui_artifact_block_image_description,
  ui_artifact_block_area_chart_description: m.ui_artifact_block_area_chart_description,
  ui_artifact_block_pie_chart_description: m.ui_artifact_block_pie_chart_description,
  ui_artifact_block_select_description: m.ui_artifact_block_select_description,
  ui_artifact_block_notes_description: m.ui_artifact_block_notes_description,
};

const blocks = artifactBlocks.parse(Object.fromEntries(Object.entries(artifactComponents).map(([name, component]) => [
  name,
  {
    description: descriptions[component.description](),
    props: z.toJSONSchema(component.props, { io: 'input' }),
  },
])));

export function artifactBlocksCatalog() {
  return blocks;
}
