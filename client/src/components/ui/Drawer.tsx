import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg';
  side?: 'right' | 'left';
}

const widthStyles = {
  sm: 'w-full max-w-xs',
  md: 'w-full max-w-sm',
  lg: 'w-full max-w-md',
};

export function Drawer({
  open,
  onClose,
  title,
  children,
  width = 'md',
  side = 'right',
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
        className={clsx(
          'fixed top-0 bottom-0 bg-white dark:bg-gray-900 shadow-2xl border-gray-200 dark:border-gray-800 flex flex-col animate-fade-in',
          widthStyles[width],
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2
              id="drawer-title"
              className="text-base font-semibold text-gray-900 dark:text-gray-100"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </div>
  );
}
