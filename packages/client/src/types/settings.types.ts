export interface SettingsDoneParams {
  /** Runs after the change saves; some actions pass a summary message to show. */
  onDone: (message?: string) => void;
}

export interface SettingsProviderStatus {
  tone: 'default' | 'success' | 'warning' | 'destructive';
  label: string;
}
