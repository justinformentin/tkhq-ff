import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let toastCount = 0;

// Simple toast state management (no external dependency)
const listeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function notify(updater: (prev: Toast[]) => Toast[]) {
  toasts = updater(toasts);
  listeners.forEach((l) => l(toasts));
}

export function toast(t: Omit<Toast, 'id'>) {
  const id = String(++toastCount);
  notify((prev) => [...prev, { ...t, id }]);
  // Auto-dismiss after 4s
  setTimeout(() => {
    notify((prev) => prev.filter((x) => x.id !== id));
  }, 4000);
}

export function useToasts() {
  const [state, setState] = useState<Toast[]>(toasts);

  useState(() => {
    listeners.push(setState);
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  });

  const dismiss = useCallback((id: string) => {
    notify((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return { toasts: state, dismiss };
}

export function useToast() {
  return { toast };
}
