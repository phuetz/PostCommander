import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import type { ReactNode } from 'react';

interface HelpButtonProps {
  title: string;
  content: ReactNode;
  label?: string;
}

export function HelpButton({ title, content, label }: HelpButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
        title={`Aide : ${title}`}
      >
        <HelpCircle size={16} aria-hidden="true" />
        {label || 'Aide'}
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title={title} width="md">
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3 leading-relaxed">
          {content}
        </div>
      </Drawer>
    </>
  );
}
