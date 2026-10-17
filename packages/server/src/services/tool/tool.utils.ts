import { TOOL_SECRET_VALUES, TOOL_SECRETS } from './tool.constants';

export function toolRedact(text: string): string {
  const keys = TOOL_SECRETS.reduce((result, pattern) => result.replaceAll(pattern, '[redacted]'), text);

  return TOOL_SECRET_VALUES.reduce((result, pattern) => result.replaceAll(pattern, '$<keep>[redacted]'), keys);
}
