import { ScrollView, View } from 'react-native';
import type { ReactNode } from 'react';

export type MarkdownTableAlign = 'left' | 'center' | 'right';

export interface MarkdownTableData {
  header: string[];
  aligns: MarkdownTableAlign[];
  rows: string[][];
}

// Columns share the width by how much they hold, with a floor so a wide table scrolls instead of crushing its text.
const MARKDOWN_TABLE = { minColumn: 64, maxColumn: 180, charWidth: 7.5, radius: 14 };

/** The text a cell shows, without link targets or emphasis marks, so markup does not widen its column. */
function markdownTableVisible(cell: string) {
  return cell.replaceAll(/\]\([^)]*\)/g, ']').replaceAll(/[*_`~[\]]/g, '');
}

interface MarkdownTableProps {
  table: MarkdownTableData;
  borderColor: string;
  renderCell: (text: string, isHeader: boolean, align: MarkdownTableAlign) => ReactNode;
}

/** A GitHub table that fills the width it is given, unlike the native one that sizes to its content. */
export function MarkdownTable({ table, borderColor, renderCell }: MarkdownTableProps) {
  const columns = table.header.map((_, column) => {
    const longest = Math.max(...[table.header, ...table.rows].map((row) => markdownTableVisible(row[column] ?? '').length));

    return {
      grow: Math.max(1, Math.min(longest, MARKDOWN_TABLE.maxColumn / MARKDOWN_TABLE.charWidth)),
      minWidth: Math.max(MARKDOWN_TABLE.minColumn, Math.min(MARKDOWN_TABLE.maxColumn, longest * MARKDOWN_TABLE.charWidth)),
    };
  });

  const row = (cells: string[], index: number, isHeader: boolean) => (
    <View
      key={index}
      style={{ flexDirection: 'row', borderTopWidth: index > 0 ? 1 : 0, borderColor }}
    >
      {columns.map((column, at) => (
        <View
          key={at}
          style={{ flexGrow: column.grow, flexBasis: 0, minWidth: column.minWidth, paddingHorizontal: 10, paddingVertical: 7 }}
        >
          {renderCell(cells[at] ?? '', isHeader, table.aligns[at] ?? 'left')}
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      contentContainerStyle={{ minWidth: '100%' }}
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, marginTop: 4, marginBottom: 12, borderWidth: 1, borderColor, borderRadius: MARKDOWN_TABLE.radius, borderCurve: 'continuous' }}
    >
      <View style={{ flexGrow: 1 }}>
        {row(table.header, 0, true)}
        {table.rows.map((cells, index) => row(cells, index + 1, false))}
      </View>
    </ScrollView>
  );
}
