import { useEffect, useState } from 'react';
import { Toast } from '@/components/ui/toast';
import { toastContext } from '@/context/toast';
import type { ToastShowParams, ToastSnapshot } from '@/types/toast.types';
import type { ReactNode } from 'react';

interface ContextToastProps {
  children: ReactNode;
}

export function ContextToast({ children }: ContextToastProps) {
  const [toast, setToast] = useState<ToastSnapshot | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = setTimeout(() => setToast(null), 3500);

    return () => clearTimeout(timer);
  }, [toast]);

  const show = ({ message, variant = 'error' }: ToastShowParams) => setToast((current) => ({ id: (current?.id ?? 0) + 1, message, variant }));

  return (
    <toastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <Toast
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          onHide={() => setToast(null)}
        />
      ) : null}
    </toastContext.Provider>
  );
}
