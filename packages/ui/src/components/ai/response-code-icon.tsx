import IconFile from '~icons/vscode-icons/default-file';
import IconAstro from '~icons/vscode-icons/file-type-astro';
import IconC from '~icons/vscode-icons/file-type-c';
import IconCpp from '~icons/vscode-icons/file-type-cpp';
import IconCsharp from '~icons/vscode-icons/file-type-csharp';
import IconCss from '~icons/vscode-icons/file-type-css';
import IconCsv from '~icons/vscode-icons/file-type-csv';
import IconDiff from '~icons/vscode-icons/file-type-diff';
import IconDocker from '~icons/vscode-icons/file-type-docker';
import IconDotenv from '~icons/vscode-icons/file-type-dotenv';
import IconElixir from '~icons/vscode-icons/file-type-elixir';
import IconGo from '~icons/vscode-icons/file-type-go';
import IconGraphql from '~icons/vscode-icons/file-type-graphql';
import IconHaskell from '~icons/vscode-icons/file-type-haskell';
import IconHtml from '~icons/vscode-icons/file-type-html';
import IconIni from '~icons/vscode-icons/file-type-ini';
import IconJava from '~icons/vscode-icons/file-type-java';
import IconJs from '~icons/vscode-icons/file-type-js-official';
import IconJson from '~icons/vscode-icons/file-type-json';
import IconKotlin from '~icons/vscode-icons/file-type-kotlin';
import IconLua from '~icons/vscode-icons/file-type-lua';
import IconMarkdown from '~icons/vscode-icons/file-type-markdown';
import IconNix from '~icons/vscode-icons/file-type-nix';
import IconObjectiveC from '~icons/vscode-icons/file-type-objectivec';
import IconPhp from '~icons/vscode-icons/file-type-php';
import IconPowershell from '~icons/vscode-icons/file-type-powershell';
import IconPrisma from '~icons/vscode-icons/file-type-prisma';
import IconPython from '~icons/vscode-icons/file-type-python';
import IconR from '~icons/vscode-icons/file-type-r';
import IconReactJs from '~icons/vscode-icons/file-type-reactjs';
import IconReactTs from '~icons/vscode-icons/file-type-reactts';
import IconRuby from '~icons/vscode-icons/file-type-ruby';
import IconRust from '~icons/vscode-icons/file-type-rust';
import IconScala from '~icons/vscode-icons/file-type-scala';
import IconScss from '~icons/vscode-icons/file-type-scss';
import IconShell from '~icons/vscode-icons/file-type-shell';
import IconSql from '~icons/vscode-icons/file-type-sql';
import IconSvelte from '~icons/vscode-icons/file-type-svelte';
import IconSwift from '~icons/vscode-icons/file-type-swift';
import IconText from '~icons/vscode-icons/file-type-text';
import IconToml from '~icons/vscode-icons/file-type-toml';
import IconTs from '~icons/vscode-icons/file-type-typescript-official';
import IconVue from '~icons/vscode-icons/file-type-vue';
import IconXml from '~icons/vscode-icons/file-type-xml';
import IconYaml from '~icons/vscode-icons/file-type-yaml';
import IconZig from '~icons/vscode-icons/file-type-zig';
import type { ReactElement } from 'react';

const responseCodeIcons = new Map<string, ReactElement>(([
  ['ts', IconTs],
  ['typescript', IconTs],
  ['mts', IconTs],
  ['cts', IconTs],
  ['js', IconJs],
  ['javascript', IconJs],
  ['mjs', IconJs],
  ['cjs', IconJs],
  ['tsx', IconReactTs],
  ['jsx', IconReactJs],
  ['py', IconPython],
  ['python', IconPython],
  ['rs', IconRust],
  ['rust', IconRust],
  ['go', IconGo],
  ['golang', IconGo],
  ['sh', IconShell],
  ['bash', IconShell],
  ['zsh', IconShell],
  ['fish', IconShell],
  ['shell', IconShell],
  ['shellscript', IconShell],
  ['console', IconShell],
  ['terminal', IconShell],
  ['ps1', IconPowershell],
  ['powershell', IconPowershell],
  ['pwsh', IconPowershell],
  ['json', IconJson],
  ['jsonc', IconJson],
  ['json5', IconJson],
  ['yaml', IconYaml],
  ['yml', IconYaml],
  ['toml', IconToml],
  ['html', IconHtml],
  ['htm', IconHtml],
  ['css', IconCss],
  ['scss', IconScss],
  ['sass', IconScss],
  ['sql', IconSql],
  ['postgres', IconSql],
  ['postgresql', IconSql],
  ['sqlite', IconSql],
  ['swift', IconSwift],
  ['kt', IconKotlin],
  ['kotlin', IconKotlin],
  ['java', IconJava],
  ['c', IconC],
  ['h', IconC],
  ['cpp', IconCpp],
  ['c++', IconCpp],
  ['cc', IconCpp],
  ['hpp', IconCpp],
  ['cs', IconCsharp],
  ['csharp', IconCsharp],
  ['c#', IconCsharp],
  ['objc', IconObjectiveC],
  ['objective-c', IconObjectiveC],
  ['rb', IconRuby],
  ['ruby', IconRuby],
  ['php', IconPhp],
  ['xml', IconXml],
  ['svg', IconXml],
  ['plist', IconXml],
  ['graphql', IconGraphql],
  ['gql', IconGraphql],
  ['vue', IconVue],
  ['svelte', IconSvelte],
  ['astro', IconAstro],
  ['lua', IconLua],
  ['zig', IconZig],
  ['ex', IconElixir],
  ['exs', IconElixir],
  ['elixir', IconElixir],
  ['hs', IconHaskell],
  ['haskell', IconHaskell],
  ['scala', IconScala],
  ['r', IconR],
  ['md', IconMarkdown],
  ['markdown', IconMarkdown],
  ['mdx', IconMarkdown],
  ['diff', IconDiff],
  ['patch', IconDiff],
  ['dockerfile', IconDocker],
  ['docker', IconDocker],
  ['nix', IconNix],
  ['env', IconDotenv],
  ['dotenv', IconDotenv],
  ['ini', IconIni],
  ['conf', IconIni],
  ['csv', IconCsv],
  ['prisma', IconPrisma],
  ['txt', IconText],
  ['text', IconText],
  ['plain', IconText],
  ['plaintext', IconText],
] as const).map(([language, Icon]) => [language, <Icon key={language} aria-hidden className="size-4 shrink-0" />]));

const responseCodeFallback = <IconFile aria-hidden className="size-4 shrink-0" />;

export function ResponseCodeIcon({ language }: { language: string }) {
  return responseCodeIcons.get(language.toLowerCase()) ?? responseCodeFallback;
}
