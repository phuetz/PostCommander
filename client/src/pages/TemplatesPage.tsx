import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Copy,
  Check,
  Sparkles,
  Search,
  LayoutGrid,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { useTemplates, useGenerateFromTemplate } from '@/hooks/useTemplates';
import type { Template } from '@/services/api';

const categoryTabs = [
  'All',
  'Startup',
  'Coaching',
  'Recruiting',
  'Personal Brand',
  'SaaS',
  'Freelance',
  'E-commerce',
  'Tech',
];

const categoryColors: Record<string, string> = {
  Startup: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  Coaching: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Recruiting: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Personal Brand': 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  SaaS: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  Freelance: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'E-commerce': 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Tech: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

function TemplateCard({
  template,
  onClick,
}: {
  template: Template;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const colorClass = categoryColors[template.category] || 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

  return (
    <Card hover padding="none" className="cursor-pointer group" onClick={onClick}>
      <div className="p-5 space-y-3">
        {/* Header badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {template.category}
          </span>
          <Badge variant="default">{template.platform}</Badge>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {template.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {template.description}
          </p>
        </div>

        {/* Example Preview */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 italic">
            {template.example}
          </p>
        </div>

        {/* Variables */}
        {template.variables.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {template.variables.slice(0, 4).map((v) => (
              <span
                key={v}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
              >
                {'{' + v + '}'}
              </span>
            ))}
            {template.variables.length > 4 && (
              <span className="text-xs text-gray-400">
                +{template.variables.length - 4} {t('templates.more', 'more')}
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
          <Sparkles size={12} />
          {t('templates.useTemplate', 'Use this template')}
        </div>
      </div>
    </Card>
  );
}

export function TemplatesPage() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentCopied, setContentCopied] = useState(false);

  const templatesQuery = useTemplates({
    category: activeCategory === 'All' ? undefined : activeCategory,
    pageSize: 50,
  });

  const generateMutation = useGenerateFromTemplate();

  const templates = templatesQuery.data?.data || [];
  const filteredTemplates = searchQuery
    ? templates.filter(
        (tpl) =>
          tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tpl.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : templates;

  const openTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setVariables({});
    setGeneratedContent('');
    setContentCopied(false);
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    
    const missingVars = selectedTemplate.variables.filter((v) => !variables[v]?.trim());
    if (missingVars.length > 0) {
      toast.error(
        t('templates.fillAllVars', 'Please fill in all variables: ') +
          missingVars.join(', '),
      );
      return;
    }

    try {
      const result = await generateMutation.mutateAsync({
        id: selectedTemplate.id,
        variables,
        provider: 'openai', // Default provider, could be dynamic
        model: 'gpt-4o',    // Default model, could be dynamic
      });
      if (result && typeof result === 'object' && 'content' in result) {
        setGeneratedContent(result.content as string);
      } else if (typeof result === 'string') {
        setGeneratedContent(result);
      }
    } catch {
      // Error is handled by the hook toast
    }
  };

  const handleCopyContent = async () => {
    await navigator.clipboard.writeText(generatedContent);
    setContentCopied(true);
    toast.success(t('post.copied', 'Copied!'));
    setTimeout(() => setContentCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
              <FileText size={22} />
            </div>
            {t('templates.title', 'Templates Library')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {t(
              'templates.subtitle',
              'Proven post templates ready to customize',
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LayoutGrid size={18} className="text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredTemplates.length} {t('templates.templates', 'templates')}
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <Input
          icon={<Search size={16} />}
          placeholder={t('templates.searchPlaceholder', 'Search templates...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {categoryTabs.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {templatesQuery.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('templates.noResults', 'No templates found')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {t('templates.noResultsDesc', 'Try a different category or search term')}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={() => openTemplate(template)}
            />
          ))}
        </div>
      )}

      {/* Template Detail Modal */}
      <Modal
        open={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        title={selectedTemplate?.name || ''}
        maxWidth="lg"
      >
        {selectedTemplate && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge>{selectedTemplate.category}</Badge>
                <Badge variant="info">{selectedTemplate.platform}</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedTemplate.description}
              </p>
            </div>

            {/* Template preview */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                {t('templates.preview', 'Template Preview')}
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                {selectedTemplate.content}
              </p>
            </div>

            {/* Variable inputs */}
            {selectedTemplate.variables.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {t('templates.fillVariables', 'Fill in the variables')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedTemplate.variables.map((varName) => (
                    <Input
                      key={varName}
                      label={varName}
                      placeholder={`Enter ${varName}...`}
                      value={variables[varName] || ''}
                      onChange={(e) =>
                        setVariables((prev) => ({
                          ...prev,
                          [varName]: e.target.value,
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              loading={generateMutation.isPending}
              icon={<Sparkles size={16} />}
              className="w-full"
            >
              {generateMutation.isPending
                ? t('templates.generating', 'Generating...')
                : t('templates.generateFromTemplate', 'Generate from Template')}
            </Button>

            {/* Generated content */}
            {generatedContent && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {t('templates.generatedContent', 'Generated Content')}
                  </h4>
                  <button
                    onClick={handleCopyContent}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      contentCopied
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-600'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {contentCopied ? <Check size={12} /> : <Copy size={12} />}
                    {contentCopied
                      ? t('post.copied', 'Copied!')
                      : t('post.copy', 'Copy')}
                  </button>
                </div>
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {generatedContent}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
