export type ToastVariant = 'default' | 'error';

export interface ToastShowParams {
  message: string;
  variant?: ToastVariant;
}

export interface ToastSnapshot {
  id: number;
  message: string;
  variant: ToastVariant;
}

export interface ToastContextValue {
  show: (params: ToastShowParams) => void;
}
