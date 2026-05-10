import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Palette,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  BarChart3,
  Type,
  Smile,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { useStyles, useCreateStyle, useDeleteStyle } from '@/hooks/useStyles';
import type { WritingStyle } from '@/services/api';
import { format } from 'date-fns';

const traitIcons: Record<string, React.ElementType> = {
  vocabularyLevel: BookOpen,
  sentenceLength: Type,
  emojiUsage: Smile,
  formality: BarChart3,
  tone: MessageSquare,
};

const traitColors: Record<string, string> = {
  vocabularyLevel: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  sentenceLength: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  emojiUsage: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  formality: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  tone: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

function TraitBadge({ traitKey, value }: { traitKey: string; value: string }) {
  const Icon = traitIcons[traitKey] || BarChart3;
  const color = traitColors[traitKey] || 'bg-gray-100 text-gray-700';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${color}`}
    >
      <Icon size={12} />
      {value}
    </span>
  );
}

function StyleCard({
  style,
  onOpen,
  onDelete,
}: {
  style: WritingStyle;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Card hover padding="none" className="group">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white flex-shrink-0">
              <Palette size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{style.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                <Calendar size={10} />
                {format(new Date(style.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{style.description}</p>

        {/* Traits */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(style.traits || {}).map(([key, value]) => (
            <TraitBadge key={key} traitKey={key} value={value as string} />
          ))}
        </div>

        {/* Action */}
        <button
          onClick={onOpen}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-brand-300 dark:hover:border-brand-700 transition-all"
        >
          <Sparkles size={14} className="text-brand-600 dark:text-brand-400" />
          {t('styles.generateWithStyle', 'Generate with this style')}
        </button>
      </div>
    </Card>
  );
}

export function StylesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<WritingStyle | null>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSamples, setNewSamples] = useState('');

  const stylesQuery = useStyles();
  const createMutation = useCreateStyle();
  const deleteMutation = useDeleteStyle();

  const styles = stylesQuery.data || [];

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error(t('styles.nameRequired', 'Please enter a name'));
      return;
    }
    const samples = newSamples
      .split('---')
      .map((s) => s.trim())
      .filter(Boolean);
    if (samples.length < 3) {
      toast.error(t('styles.samplesRequired', 'Please provide at least 3 sample posts'));
      return;
    }

    await createMutation.mutateAsync({
      name: newName,
      description: newDescription,
      samplePosts: samples,
    });

    setShowCreateModal(false);
    setNewName('');
    setNewDescription('');
    setNewSamples('');
  };

  const openDetail = (style: WritingStyle) => {
    setSelectedStyle(style);
    setShowDetailModal(true);
  };

  const handleGenerateWithStyle = (style: WritingStyle) => {
    navigate('/app/generate', { state: { styleId: style.id, styleName: style.name } });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <Palette size={22} />
            </div>
            {t('styles.title', 'Writing Styles')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {t('styles.subtitle', 'Create and manage your personal writing styles')}
          </p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setShowCreateModal(true)}>
          {t('styles.createNew', 'Create New Style')}
        </Button>
      </div>

      {/* Styles Grid */}
      {stylesQuery.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : styles.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <Palette size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('styles.noStyles', 'No writing styles yet')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {t(
                'styles.noStylesDesc',
                'Create your first writing style by providing sample posts. We will analyze your writing patterns and tone.',
              )}
            </p>
            <Button icon={<Plus size={18} />} onClick={() => setShowCreateModal(true)}>
              {t('styles.createFirst', 'Create Your First Style')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {styles.map((style) => (
            <StyleCard
              key={style.id}
              style={style}
              onOpen={() => openDetail(style)}
              onDelete={() => deleteMutation.mutate(style.id)}
            />
          ))}
        </div>
      )}

      {/* Create New Style Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('styles.createTitle', 'Create New Writing Style')}
        maxWidth="lg"
      >
        <div className="space-y-5">
          <Input
            label={t('styles.nameLabel', 'Style name')}
            placeholder={t('styles.namePlaceholder', 'e.g., Professional LinkedIn Voice')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          <Input
            label={t('styles.descriptionLabel', 'Description')}
            placeholder={t(
              'styles.descriptionPlaceholder',
              'Brief description of this writing style',
            )}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />

          <TextArea
            label={t('styles.samplesLabel', 'Sample posts (minimum 3, separated by ---)')}
            placeholder={t(
              'styles.samplesPlaceholder',
              'Paste your sample posts here, separating each with --- on its own line...\n\nPost 1 content here...\n\n---\n\nPost 2 content here...\n\n---\n\nPost 3 content here...',
            )}
            value={newSamples}
            onChange={(e) => setNewSamples(e.target.value)}
            rows={10}
          />

          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              {t(
                'styles.samplesHint',
                'Provide 3-5 sample posts that represent your writing style. The AI will analyze vocabulary, sentence structure, tone, and other patterns to replicate your unique voice.',
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
              icon={<Sparkles size={16} />}
            >
              {createMutation.isPending
                ? t('styles.analyzing', 'Analyzing...')
                : t('styles.analyzeAndSave', 'Analyze & Save')}
            </Button>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Style Detail Modal */}
      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedStyle?.name || ''}
        maxWidth="lg"
      >
        {selectedStyle && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedStyle.description}</p>

            {/* Style Profile */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {t('styles.profile', 'Style Profile')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(selectedStyle.traits || {}).map(([key, value]) => {
                  const Icon = traitIcons[key] || BarChart3;
                  const color = traitColors[key] || 'bg-gray-100 text-gray-700';
                  const label = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (s) => s.toUpperCase());

                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}
                      >
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {value as string}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sample Posts */}
            {(selectedStyle.samplePosts || []).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {t('styles.samples', 'Sample Posts')}
                </h4>
                <div className="space-y-2">
                  {selectedStyle.samplePosts.map((sample, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-4 leading-relaxed">
                        {sample}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button
                icon={<Sparkles size={16} />}
                onClick={() => {
                  setShowDetailModal(false);
                  handleGenerateWithStyle(selectedStyle);
                }}
              >
                {t('styles.generateWithStyle', 'Generate with this style')}
              </Button>
              <Button
                variant="danger"
                icon={<Trash2 size={16} />}
                onClick={() => {
                  deleteMutation.mutate(selectedStyle.id);
                  setShowDetailModal(false);
                }}
              >
                {t('common.delete', 'Delete')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
