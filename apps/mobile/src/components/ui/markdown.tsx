import { createContext, Fragment, use } from 'react';
import { Linking, ScrollView, StyleSheet } from 'react-native';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';
import { match } from 'ts-pattern';
import { useCSSVariable, useUniwind } from 'uniwind';
import { MarkdownTable } from './markdown-table';
import type { MarkdownTableAlign, MarkdownTableData } from './markdown-table';
import type { ComponentProps } from 'react';
import type { MarkdownStyle } from 'react-native-enriched-markdown';

/** Text colour for markdown inside a coloured surface, such as the owner's bubble. */
export const markdownColorContext = createContext<string | undefined>(undefined);

// Code colours from T3 Code's GitHub-like palettes.
const MARKDOWN_SYNTAX = {
  dark: {
    keyword: '#ff7b72',
    string: '#a5d6ff',
    number: '#79c0ff',
    constant: '#79c0ff',
    comment: '#8b949e',
    function: '#d2a8ff',
    type: '#ffa657',
    property: '#79c0ff',
    tag: '#7ee787',
    attribute: '#79c0ff',
  },
  light: {
    keyword: '#cf222e',
    string: '#0a3069',
    number: '#0550ae',
    constant: '#0550ae',
    comment: '#6e7781',
    function: '#8250df',
    type: '#953800',
    property: '#0550ae',
    tag: '#116329',
    attribute: '#0550ae',
  },
} as const;

/** Tall code blocks scroll inside this height, like the web cap. */
const MARKDOWN_CODE_MAX_HEIGHT = 320;

/** The web code block's shape: a rounded panel with a 1pt edge. */
const MARKDOWN_CODE_BLOCK = { marginTop: 4, marginBottom: 12, borderRadius: 14, borderWidth: 1 };

interface MarkdownBlock {
  kind: 'text' | 'code' | 'table';
  text: string;
}

const MARKDOWN_TABLE_ROW = /^ {0,3}\S.*\|/;
const MARKDOWN_TABLE_SEPARATOR = /^ {0,3}\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$|^ {0,3}\|\s*:?-+:?\s*\|\s*$/;

/**
 * Splits top-level fenced code blocks and tables out of the markdown: code scrolls inside a capped height, and a
 * table fills the width. An unclosed fence runs to the end, as while streaming.
 */
function markdownBlocks(markdown: string) {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.split('\n');
  let fence: string | undefined;

  for (const [index, line] of lines.entries()) {
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1];
    const last = blocks.at(-1);
    const isTableStart = MARKDOWN_TABLE_ROW.test(line) && MARKDOWN_TABLE_SEPARATOR.test(lines[index + 1] ?? '');

    if (fence === undefined && isTableStart) {
      blocks.push({ kind: 'table', text: line });
    } else if (fence === undefined && last?.kind === 'table' && MARKDOWN_TABLE_ROW.test(line)) {
      last.text += `\n${line}`;
    } else if (fence === undefined && marker) {
      fence = marker;
      blocks.push({ kind: 'code', text: line });
    } else if (fence !== undefined && last) {
      last.text += `\n${line}`;

      if (marker?.startsWith(fence) && line.trim() === marker) {
        fence = undefined;
      }
    } else if (last?.kind === 'text') {
      last.text += `\n${line}`;
    } else {
      blocks.push({ kind: 'text', text: line });
    }
  }

  return blocks.filter((block) => block.text.trim());
}

function markdownTableCells(line: string) {
  const cells = line.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '').split(/(?<!\\)\|/);

  return cells.map((cell) => cell.trim().replaceAll('\\|', '|'));
}

function markdownTable(text: string): MarkdownTableData {
  const [header = '', separator = '', ...rows] = text.split('\n');

  const aligns = markdownTableCells(separator).map((cell): MarkdownTableAlign => match([cell.startsWith(':'), cell.endsWith(':')])
    .with([true, true], () => 'center' as const)
    .with([false, true], () => 'right' as const)
    .otherwise(() => 'left' as const));

  return { header: markdownTableCells(header), aligns, rows: rows.map(markdownTableCells) };
}

const MARKDOWN_TEXT = { fontFamily: 'Inter', fontSize: 16, lineHeight: 21, marginTop: 0, marginBottom: 8 };

interface MarkdownProps {
  children: string;
  isStreaming?: boolean;
  /** Muted and smaller, for secondary text such as a bot's reasoning. */
  tone?: 'default' | 'muted';
  /** Native text selection; off in bubbles so a long press opens the message actions. */
  selectable?: boolean;
  /** Extra actions in the native text selection menu, such as quoting the selection. */
  menuItems?: ComponentProps<typeof EnrichedMarkdownText>['contextMenuItems'];
  /** Handles a tapped link; links open in the browser otherwise. */
  onLinkPress?: (url: string) => void;
}

export function Markdown({ children, isStreaming = false, tone = 'default', selectable = false, menuItems, onLinkPress = (url) => void Linking.openURL(url) }: MarkdownProps) {
  const color = use(markdownColorContext);
  const { theme } = useUniwind();

  const [foreground, muted, border, codeBackground, link, background] = useCSSVariable([
    '--color-foreground',
    '--color-muted-foreground',
    '--color-border',
    '--color-muted',
    '--color-primary',
    '--color-background',
  ]).map(String);

  const text = match(tone)
    .with('muted', () => ({ ...MARKDOWN_TEXT, fontSize: 14, lineHeight: 20, color: muted }))
    .with('default', () => ({ ...MARKDOWN_TEXT, color: color ?? foreground }))
    .exhaustive();

  // Like web: space above a heading, little below, so it reads with the block it introduces.
  const heading = (fontSize: number) => ({ ...text, fontSize, lineHeight: Math.round(fontSize * 1.3), fontWeight: '600', marginTop: 12, marginBottom: 4 });
  // Blocks nest in the 24pt bubble: its radius less its padding, with a hairline edge.
  const block = { marginTop: 4, marginBottom: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: border };

  // Like web, a fence is a page-coloured panel; inside a coloured bubble it darkens the bubble colour instead.
  const fence = match({ color, theme })
    .with({ color: undefined }, () => background)
    .with({ theme: 'dark' }, () => 'rgba(0, 0, 0, 0.28)')
    .otherwise(() => 'rgba(0, 0, 0, 0.16)');

  const markdownStyle: MarkdownStyle = {
    paragraph: text,
    h1: heading(24),
    h2: heading(21),
    h3: heading(19),
    h4: heading(17),
    h5: heading(16),
    h6: heading(16),
    strong: { fontWeight: 'bold' },
    em: { fontStyle: 'italic' },
    strikethrough: { color: text.color },
    link: { color: color ?? link, underline: true },
    // Bot mentions and quotes read as clean tags, like the pills on web: medium weight, no underline or fill.
    linkVariants: { '^(bot|quote):': { color: text.color, fontFamily: 'Inter-Medium', underline: false } },
    code: { fontFamily: 'Menlo', fontSize: 14, color: text.color, backgroundColor: codeBackground, borderColor: 'transparent' },
    blockquote: { ...text, color: muted, borderColor: border, borderWidth: 3, gapWidth: 12, backgroundColor: 'transparent' },
    // Web's list geometry: text 22pt in (a 14pt marker column and an 8pt gap), each nested level 20pt further, 4pt between items.
    list: { ...text, bulletColor: muted, markerColor: muted, bulletSize: 5, markerMinWidth: 14, gapWidth: 8, marginLeft: 20, itemSpacing: 4 },
    thematicBreak: { color: border, height: 1, marginTop: 8, marginBottom: 8 },
    codeBlock: {
      ...text,
      ...MARKDOWN_CODE_BLOCK,
      borderColor: border,
      fontFamily: 'Menlo',
      fontSize: 12,
      lineHeight: 17,
      backgroundColor: fence,
      padding: 12,
      syntaxColors: theme === 'dark' ? MARKDOWN_SYNTAX.dark : MARKDOWN_SYNTAX.light,
    },
    taskList: { checkedColor: link, borderColor: muted, checkmarkColor: background, checkedTextColor: muted, checkedStrikethrough: true },
    table: {
      ...text,
      ...block,
      fontSize: 14,
      headerBackgroundColor: codeBackground,
      headerTextColor: text.color,
      rowEvenBackgroundColor: 'transparent',
      rowOddBackgroundColor: 'transparent',
      cellPaddingHorizontal: 10,
      cellPaddingVertical: 7,
    },
  };

  const segments = markdownBlocks(children);

  // A capped code block's scroll box draws the block's edge, so the bottom stays rounded while it scrolls.
  const capped: MarkdownStyle = { ...markdownStyle, codeBlock: { ...markdownStyle.codeBlock, marginTop: 0, marginBottom: 0, borderWidth: 0, borderRadius: 0 } };
  // A scroll view grows to its cap by default; flexGrow 0 keeps a short block its own height.
  const cap = { ...MARKDOWN_CODE_BLOCK, borderColor: border, maxHeight: MARKDOWN_CODE_MAX_HEIGHT, flexGrow: 0 };

  const render = (markdown: string, isLast: boolean, style = markdownStyle) => (
    <EnrichedMarkdownText
      contextMenuItems={menuItems}
      flavor="github"
      selectable={selectable}
      markdown={markdown}
      markdownStyle={style}
      streamingAnimation={isStreaming && isLast}
      onLinkPress={({ url }) => onLinkPress(url)}
    />
  );

  if (segments.every((segment) => segment.kind === 'text')) {
    return render(children, true);
  }

  const cell = (content: string, isHeader: boolean, align: MarkdownTableAlign) => {
    const paragraph = { ...text, fontSize: 14, lineHeight: 20, marginBottom: 0, textAlign: align, fontFamily: isHeader ? 'Inter-Medium' : text.fontFamily, color: isHeader ? muted : text.color };

    return render(content, false, { ...markdownStyle, paragraph });
  };

  return segments.map((segment, index) => match(segment.kind)
    .with('code', () => (
      <ScrollView key={index} nestedScrollEnabled style={cap}>
        {render(segment.text, index === segments.length - 1, capped)}
      </ScrollView>
    ))
    .with('table', () => (
      <MarkdownTable
        borderColor={border}
        key={index}
        renderCell={cell}
        table={markdownTable(segment.text)}
      />
    ))
    .with('text', () => <Fragment key={index}>{render(segment.text, index === segments.length - 1)}</Fragment>)
    .exhaustive());
}
