import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Copy, Sparkles, Check } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
}

// Hardcoded snippets for now. In a real app, these would come from the backend.
const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 't1',
    name: 'Premier contact (Formel)',
    content: 'Bonjour {{firstName}},\n\nJ\'ai vu que vous travaillez chez {{company}}. Votre dernier post m\'a beaucoup intéressé.\n\nSeriez-vous ouvert(e) à un échange de 15 minutes ?\n\nBien à vous,\n{{senderName}}'
  },
  {
    id: 't2',
    name: 'Relance amicale',
    content: 'Salut {{firstName}},\n\nJe me permets de vous relancer suite à mon précédent message. Avez-vous eu le temps d\'y jeter un œil ?\n\nA très vite,\n{{senderName}}'
  },
  {
    id: 't3',
    name: 'Remerciement commentaire',
    content: 'Merci beaucoup {{firstName}} pour votre commentaire pertinent ! C\'est exactement ça. Au plaisir d\'échanger à nouveau sur ces sujets.'
  }
];

interface MessageTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (content: string) => void;
  recipientName?: string;
}

export function MessageTemplateModal({ open, onClose, onApply, recipientName = '' }: MessageTemplateModalProps) {
  const { t } = useTranslation();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({
    firstName: recipientName.split(' ')[0] || '', // Auto-fill first name
    senderName: 'Alex' // Mock sender name
  });

  const selectedTemplate = useMemo(
    () => DEFAULT_TEMPLATES.find(t => t.id === selectedTemplateId),
    [selectedTemplateId]
  );

  // Extract variables like {{firstName}} using regex
  const extractedVariables = useMemo(() => {
    if (!selectedTemplate) return [];
    const matches = selectedTemplate.content.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    // Remove brackets and return unique variables
    return Array.from(new Set(matches.map(m => m.replace(/[{}]/g, ''))));
  }, [selectedTemplate]);

  // Generate final text
  const generatedText = useMemo(() => {
    if (!selectedTemplate) return '';
    let text = selectedTemplate.content;
    extractedVariables.forEach(v => {
      const val = variables[v] || `[${v}]`;
      text = text.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), val);
    });
    return text;
  }, [selectedTemplate, variables, extractedVariables]);

  const handleApply = () => {
    if (generatedText) {
      onApply(generatedText);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Insérer un modèle de message" maxWidth="3xl">
      <div className="grid md:grid-cols-2 gap-6 max-h-[70vh]">
        {/* Left: Template Selection */}
        <div className="flex flex-col gap-3 overflow-y-auto pr-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Vos modèles (Snippets)</h4>
          {DEFAULT_TEMPLATES.map(template => (
            <Card 
              key={template.id}
              hover
              onClick={() => setSelectedTemplateId(template.id)}
              className={`p-3 cursor-pointer transition-colors ${selectedTemplateId === template.id ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50/50 dark:bg-brand-900/20' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText size={16} className={selectedTemplateId === template.id ? 'text-brand-500' : 'text-gray-400'} />
                <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100">{template.name}</h5>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{template.content}</p>
            </Card>
          ))}
        </div>

        {/* Right: Variable filling & Preview */}
        <div className="flex flex-col gap-4 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-4 md:pt-0 md:pl-6">
          {!selectedTemplate ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
              <Sparkles size={32} className="opacity-20 mb-3" />
              <p className="text-sm">Sélectionnez un modèle à gauche pour commencer.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Variables dynamiques</h4>
                {extractedVariables.length === 0 ? (
                  <p className="text-xs text-gray-500">Aucune variable dans ce modèle.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {extractedVariables.map(v => (
                      <Input
                        key={v}
                        label={v}
                        value={variables[v] || ''}
                        onChange={e => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                        placeholder={`Saisir ${v}...`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-2 mt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Aperçu final</h4>
                <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {generatedText}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <Button variant="ghost" onClick={onClose}>Annuler</Button>
                <Button onClick={handleApply} icon={<Check size={16} />}>Insérer</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
