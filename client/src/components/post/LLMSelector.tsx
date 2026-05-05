import { useTranslation } from 'react-i18next';
import { LLM_PROVIDERS, type LLMProviderId } from '@postcommander/shared';
import { Select } from '@/components/ui/Select';

interface LLMSelectorProps {
  provider: LLMProviderId;
  model: string;
  onProviderChange: (provider: LLMProviderId) => void;
  onModelChange: (model: string) => void;
}

export function LLMSelector({
  provider,
  model,
  onProviderChange,
  onModelChange,
}: LLMSelectorProps) {
  const { t } = useTranslation();

  const currentProvider = LLM_PROVIDERS.find((p) => p.id === provider);
  const models = currentProvider?.models || [];

  const providerOptions = LLM_PROVIDERS.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const modelOptions = models.map((m) => ({
    value: m.id,
    label: m.name,
    description: m.description,
  }));

  const handleProviderChange = (newProvider: string) => {
    const p = LLM_PROVIDERS.find((pr) => pr.id === newProvider);
    onProviderChange(newProvider as LLMProviderId);
    if (p && p.models.length > 0) {
      onModelChange(p.models[0].id);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('generate.llm', 'AI Model')}
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          options={providerOptions}
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value)}
          placeholder={t('generate.selectProvider', 'Select provider')}
        />
        <Select
          options={modelOptions}
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          placeholder={t('generate.selectModel', 'Select model')}
        />
      </div>
    </div>
  );
}
