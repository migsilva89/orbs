import { ScriptOnce } from '@tanstack/react-router';
import { layoutApplyShell } from '@/services/layout/layout.client';

export function ContextShellScript() {
  return <ScriptOnce>{`(${layoutApplyShell.toString()})();`}</ScriptOnce>;
}
