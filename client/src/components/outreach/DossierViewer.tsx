import React from 'react';
import { Search } from 'lucide-react';

interface DossierViewerProps {
  dossierContent: string;
}

export function DossierViewer({ dossierContent }: DossierViewerProps) {
  return (
    <div className="mt-6 border-t border-border pt-4">
      <h5 className="text-sm font-bold flex items-center gap-2 mb-4 text-brand-600 dark:text-brand-400">
        <Search className="w-4 h-4" /> DOSSIER D'INVESTIGATION OSINT
      </h5>
      <div 
        className="prose prose-sm dark:prose-invert max-w-none text-xs"
        dangerouslySetInnerHTML={{ 
          __html: dossierContent
            .replace(/## (.*)/g, '<h3 class="text-sm font-bold mt-4 mb-2">$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>')
        }}
      />
    </div>
  );
}
