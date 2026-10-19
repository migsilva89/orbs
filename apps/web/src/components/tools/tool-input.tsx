import { toolCallEdits, toolCallJson, toolCallValue } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { match } from 'ts-pattern';
import { QuestionDetail, QuestionDetails } from '@/components/ui/ai/question';
import { ToolCode } from '@/components/ui/ai/tool';
import { Clamp } from '@/components/ui/clamp';
import { cn } from '@/lib/cn';
import { TOOL_CODE_KEYS } from '@/services/tool/tool.constants';
import { toolReadableName } from '@/services/tool/tool.utils';
import type { ToolCallJsonValue } from '@openbots/contracts/universal';
import type { DynamicToolUIPart } from 'ai';

interface ToolInputDiffProps {
  text: string
}

function ToolInputDiff({ text }: ToolInputDiffProps) {
  return (
    <ToolCode>
      {text.split('\n').map((line, index) => (
        <span className={cn('block', line.startsWith('+') && 'text-success', line.startsWith('-') && 'text-destructive')} key={index}>{line || ' '}</span>
      ))}
    </ToolCode>
  );
}

interface ToolInputValueProps {
  name: string
  value: ToolCallJsonValue
}

function ToolInputValue({ name, value }: ToolInputValueProps) {
  const parsed = toolCallValue.safeParse(value);

  if (!parsed.success) {
    return null;
  }

  return match(parsed.data)
    .with({ kind: 'text' }, ({ text }) => {
      return TOOL_CODE_KEYS.has(name) ? <ToolCode>{text}</ToolCode> : <Clamp>{text}</Clamp>;
    })
    .with({ kind: 'flag' }, ({ flag }) => <span>{flag ? m.tool_field_yes() : m.tool_field_no()}</span>)
    .with({ kind: 'number' }, ({ number }) => <span className="tabular-nums">{number}</span>)
    .with({ kind: 'list' }, ({ items }) => {
      const words = items.flatMap((item) => match(toolCallValue.safeParse(item).data)
        .with({ kind: 'text' }, ({ text }) => [text])
        .with({ kind: 'number' }, ({ number }) => [String(number)])
        .otherwise(() => []));

      return words.length === items.length ? <Clamp size="sm">{words.join(', ')}</Clamp> : (
        <ol className="flex min-w-0 list-decimal flex-col gap-2 pl-4 marker:text-muted-foreground">
          {items.map((item, index) => (
            <li className="min-w-0" key={index}>
              <ToolInputValue name={name} value={item} />
            </li>
          ))}
        </ol>
      );
    })
    .with({ kind: 'fields' }, ({ fields }) => {
      const schema = fields.type === 'object' ? toolCallJson.safeParse(fields.properties).data : undefined;

      return schema ? <span>{Object.keys(schema).map(toolReadableName).join(', ')}</span> : <ToolInputFields fields={fields} />;
    })
    .exhaustive();
}

interface ToolInputFieldsProps {
  fields: Record<string, ToolCallJsonValue>
}

function ToolInputFields({ fields }: ToolInputFieldsProps) {
  const shown = Object.entries(fields).filter(([, value]) => value !== null && value !== '');

  return shown.length > 0 ? (
    <QuestionDetails>
      {shown.map(([key, value]) => (
        <QuestionDetail key={key} label={toolReadableName(key)}>
          <ToolInputValue name={key} value={value} />
        </QuestionDetail>
      ))}
    </QuestionDetails>
  ) : null;
}

interface ToolInputProps {
  input: DynamicToolUIPart['input']
}

export function ToolInput({ input }: ToolInputProps) {
  const fields = toolCallJson.safeParse(input).data ?? {};
  const edits = toolCallEdits.safeParse(fields.edits).data;

  if (!edits) {
    return <ToolInputFields fields={fields} />;
  }

  const rest = Object.fromEntries(Object.entries(fields).filter(([key]) => key !== 'edits'));

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <ToolInputFields fields={rest} />
      {edits.map((edit, index) => (
        <ToolInputDiff key={index} text={[...edit.oldText.split('\n').map((line) => `- ${line}`), ...edit.newText.split('\n').map((line) => `+ ${line}`)].join('\n')} />
      ))}
    </div>
  );
}
