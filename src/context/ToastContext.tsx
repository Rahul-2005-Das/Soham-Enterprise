import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let nextId = 1;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const iconFor = (variant: ToastVariant) => {
    if (variant === 'success') return <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />;
    if (variant === 'error') return <XCircle className="w-4 h-4 text-rose-600 shrink-0" />;
    return <Info className="w-4 h-4 text-blue-600 shrink-0" />;
  };

  const colorsFor = (variant: ToastVariant) => {
    if (variant === 'success') return 'bg-emerald-50 border-emerald-200 text-emerald-800';
    if (variant === 'error') return 'bg-rose-50 border-rose-200 text-rose-800';
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-2.5 p-3.5 rounded-xl border shadow-lg text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200 ${colorsFor(
              toast.variant
            )}`}
          >
            {iconFor(toast.variant)}
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
