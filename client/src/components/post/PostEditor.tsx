import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';

interface PostEditorProps {
  content: string;
  charLimit?: number;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export function PostEditor({ content, charLimit, onSave, onCancel }: PostEditorProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(content);

  return (
    <div className="space-y-3">
      <TextArea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        charLimit={charLimit}
        rows={6}
        className="font-mono text-sm"
        autoFocus
      />
      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button size="sm" onClick={() => onSave(value)}>
          {t('common.save', 'Save')}
        </Button>
      </div>
    </div>
  );
}
