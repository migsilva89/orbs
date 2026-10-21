import { Panel, PanelContent, PanelHeader, PanelIcon, PanelTitle } from '@/components/ui/panel';
import type { ComponentType, ReactNode } from 'react';

interface SettingsPanelProps {
  id: string
  title: string
  icon: ComponentType
  children: ReactNode
}

export function SettingsPanel({ id, title, icon: Icon, children }: SettingsPanelProps) {
  return (
    <Panel
      aria-labelledby={`${id}-title`}
      className="scroll-mt-4"
      id={id}
    >
      <PanelHeader>
        <PanelIcon><Icon /></PanelIcon>
        <PanelContent>
          <PanelTitle id={`${id}-title`}>{title}</PanelTitle>
        </PanelContent>
      </PanelHeader>
      {children}
    </Panel>
  );
}
