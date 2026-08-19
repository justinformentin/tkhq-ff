import { useToasts } from '../hooks/useToast';
import { cn } from '../lib/utils';
import { X } from 'lucide-react';

export function Toaster() {
  const { toasts, dismiss } = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm',
            t.variant === 'destructive'
              ? 'bg-red-950 border-red-800 text-red-200'
              : 'bg-gray-800 border-gray-700 text-gray-100'
          )}
        >
          <div className="flex-1">
            <p className="font-medium">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 text-xs opacity-75">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="text-gray-400 hover:text-gray-200 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
