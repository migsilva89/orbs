export interface SettingsDoneParams {
  onDone: (message?: string) => void;
}

export interface SettingsProviderStatus {
  tone: 'default' | 'success' | 'warning' | 'destructive';
  label: string;
}
