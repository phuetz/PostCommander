import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Columns3,
  Plus,
  Sparkles,
  Trash2,
  Edit3,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import type { LLMProviderId } from '@postcommander/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { LLMSelector } from '@/components/post/LLMSelector';
import {
  usePillars,
  usePillarIdeas,
  useCreatePillar,
  useUpdatePillar,
  useDeletePillar,
  useCreateIdea,
  useUpdateIdea,
  useDeleteIdea,
  useGenerateIdeas,
} from '@/hooks/usePillars';
import type { PillarWithCount, ContentIdea, CreatePillarParams } from '@/services/api';

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
];

const platformOptions = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'pinterest', label: 'Pinterest' },
];

const colorOptions = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#22c55e', '#06b6d4', '#6366f1',
  '#14b8a6', '#f97316', '#a855f7', '#64748b',
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' }> = {
  idea: { label: 'Idea', variant: 'info' },
  drafted: { label: 'Drafted', variant: 'warning' },
  scheduled: { label: 'Scheduled', variant: 'default' },
  published: { label: 'Published', variant: 'success' },
};

// ── Strategy Overview Component ──────────────────────────────────────

function StrategyStats({ pillars }: { pillars: PillarWithCount[] }) {
  const { t } = useTranslation();

  const totalIdeas = pillars.reduce((sum, p) => sum + p.ideaCount, 0);
  const totalDrafted = pillars.reduce((sum, p) => sum + (p.ideaCountByStatus.drafted || 0), 0);
  const totalScheduled = pillars.reduce((sum, p) => sum + (p.ideaCountByStatus.scheduled || 0), 0);
  const totalPublished = pillars.reduce((sum, p) => sum + (p.ideaCountByStatus.published || 0), 0);

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <BarChart3 size={18} className="text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t('pillars.strategyOverview', 'Strategy Overview')}
          </h3>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">
              {t('pillars.totalPillars', 'Pillars')}:
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{pillars.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">
              {t('pillars.totalIdeas', 'Ideas')}:
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{totalIdeas}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">
              {t('pillars.drafted', 'Drafted')}:
            </span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">{totalDrafted}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">
              {t('pillars.scheduled', 'Scheduled')}:
            </span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">{totalScheduled}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">
              {t('pillars.published', 'Published')}:
            </span>
            <span className="font-semibold text-green-600 dark:text-green-400">{totalPublished}</span>
          </div>
        </div>

        {/* Mini distribution bar */}
        {pillars.length > 0 && totalIdeas > 0 && (
          <div className="w-full flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
            {pillars.map((pillar) => (
              pillar.ideaCount > 0 ? (
                <div
                  key={pillar.id}
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${(pillar.ideaCount / totalIdeas) * 100}%`,
                    backgroundColor: pillar.color,
                  }}
                  title={`${pillar.name}: ${pillar.ideaCount} ideas`}
                />
              ) : null
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Idea Card Component ──────────────────────────────────────────────

function IdeaCard({
  idea,
  onUpdateStatus,
  onDelete,
}: {
  idea: ContentIdea;
  onUpdateStatus: (status: string) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const config = statusConfig[idea.status] || statusConfig.idea;

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug flex-1">
            {idea.title}
          </h5>
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 transition-all"
            title={t('common.delete', 'Delete')}
          >
            <Trash2 size={12} />
          </button>
        </div>
        {idea.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {idea.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Badge variant={config.variant}>
            {t(`pillars.status.${idea.status}`, config.label)}
          </Badge>
          <select
            value={idea.status}
            onChange={(e) => onUpdateStatus(e.target.value)}
            className="text-xs bg-transparent border-none text-gray-400 dark:text-gray-500 cursor-pointer focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <option value="idea">{t('pillars.status.idea', 'Idea')}</option>
            <option value="drafted">{t('pillars.status.drafted', 'Drafted')}</option>
            <option value="scheduled">{t('pillars.status.scheduled', 'Scheduled')}</option>
            <option value="published">{t('pillars.status.published', 'Published')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ── Pillar Column Component ──────────────────────────────────────────

function PillarColumn({
  pillar,
  onEdit,
  onDelete,
  onGenerateIdeas,
  isGenerating,
}: {
  pillar: PillarWithCount;
  onEdit: () => void;
  onDelete: () => void;
  onGenerateIdeas: () => void;
  isGenerating: boolean;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const [showAddIdea, setShowAddIdea] = useState(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');

  const { data: ideas = [], isLoading: ideasLoading } = usePillarIdeas(pillar.id);
  const createIdeaMutation = useCreateIdea();
  const updateIdeaMutation = useUpdateIdea();
  const deleteIdeaMutation = useDeleteIdea();

  const handleAddIdea = async () => {
    if (!newIdeaTitle.trim()) return;
    await createIdeaMutation.mutateAsync({ pillarId: pillar.id, data: { title: newIdeaTitle.trim() } });
    setNewIdeaTitle('');
    setShowAddIdea(false);
  };

  return (
    <div className="flex flex-col min-w-[300px] max-w-[350px] flex-shrink-0">
      {/* Pillar Header */}
      <div
        className="rounded-t-xl px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: pillar.color + '20', borderLeft: `3px solid ${pillar.color}` }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: pillar.color }}
          />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {pillar.name}
          </h4>
          <Badge variant="default">{pillar.ideaCount}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title={t('common.edit', 'Edit')}
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
            title={t('common.delete', 'Delete')}
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Pillar Description */}
      {pillar.description && expanded && (
        <div className="px-4 py-2 bg-white dark:bg-gray-900 border-x border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
          {pillar.description}
        </div>
      )}

      {/* Ideas List */}
      {expanded && (
        <div className="flex-1 bg-white dark:bg-gray-900 border-x border-b border-gray-200 dark:border-gray-800 rounded-b-xl p-3 space-y-2 max-h-[500px] overflow-y-auto">
          {ideasLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : ideas.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
              {t('pillars.noIdeas', 'No ideas yet. Add one or generate with AI.')}
            </p>
          ) : (
            ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onUpdateStatus={(status) =>
                  updateIdeaMutation.mutate({ ideaId: idea.id, data: { status } })
                }
                onDelete={() => deleteIdeaMutation.mutate(idea.id)}
              />
            ))
          )}

          {/* Add Idea Inline */}
          {showAddIdea ? (
            <div className="space-y-2 pt-2">
              <input
                type="text"
                value={newIdeaTitle}
                onChange={(e) => setNewIdeaTitle(e.target.value)}
                placeholder={t('pillars.ideaTitlePlaceholder', 'Content idea title...')}
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddIdea();
                  if (e.key === 'Escape') setShowAddIdea(false);
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddIdea}
                  disabled={!newIdeaTitle.trim()}
                  loading={createIdeaMutation.isPending}
                >
                  {t('common.add', 'Add')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowAddIdea(false);
                    setNewIdeaTitle('');
                  }}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddIdea(true)}
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                <Plus size={12} />
                {t('pillars.addIdea', 'Add idea')}
              </button>
              <button
                onClick={onGenerateIdeas}
                disabled={isGenerating}
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors disabled:opacity-50"
              >
                {isGenerating ? <Spinner size="sm" /> : <Sparkles size={12} />}
                {isGenerating
                  ? t('pillars.generatingIdeas', 'Generating...')
                  : t('pillars.generateIdeas', 'AI Ideas')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Create/Edit Pillar Modal ─────────────────────────────────────────

function PillarModal({
  open,
  onClose,
  pillar,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  pillar?: PillarWithCount | null;
  onSubmit: (data: CreatePillarParams) => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [frequency, setFrequency] = useState('weekly');
  const [topics, setTopics] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  useEffect(() => {
    if (pillar) {
      setName(pillar.name);
      setDescription(pillar.description || '');
      setColor(pillar.color);
      setFrequency(pillar.postingFrequency);
      setTopics((pillar.topics || []).join(', '));
      setSelectedPlatforms(pillar.targetPlatforms || []);
    } else {
      setName('');
      setDescription('');
      setColor('#3b82f6');
      setFrequency('weekly');
      setTopics('');
      setSelectedPlatforms([]);
    }
  }, [pillar, open]);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId],
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(t('pillars.nameRequired', 'Pillar name is required'));
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      topics: topics.split(',').map((t) => t.trim()).filter(Boolean),
      postingFrequency: frequency,
      targetPlatforms: selectedPlatforms,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={pillar
        ? t('pillars.editPillar', 'Edit Pillar')
        : t('pillars.createPillar', 'Create Pillar')}
      maxWidth="lg"
    >
      <div className="space-y-5">
        <Input
          label={t('pillars.name', 'Pillar Name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('pillars.namePlaceholder', 'e.g., Leadership Insights')}
        />

        <TextArea
          label={t('pillars.description', 'Description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('pillars.descriptionPlaceholder', 'What topics does this pillar cover?')}
          rows={2}
        />

        <Input
          label={t('pillars.topics', 'Subtopics (comma-separated)')}
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          placeholder={t('pillars.topicsPlaceholder', 'e.g., team management, decision making, communication')}
        />

        {/* Color Picker */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('pillars.color', 'Color')}
          </label>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={clsx(
                  'w-8 h-8 rounded-full transition-all',
                  color === c && 'ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100 dark:ring-offset-gray-900',
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <Select
          label={t('pillars.frequency', 'Posting Frequency')}
          options={frequencyOptions}
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
        />

        {/* Platform Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('pillars.targetPlatforms', 'Target Platforms')}
          </label>
          <div className="flex flex-wrap gap-2">
            {platformOptions.map((p) => (
              <button
                key={p.value}
                onClick={() => togglePlatform(p.value)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  selectedPlatforms.includes(p.value)
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!name.trim()}>
            {pillar
              ? t('common.save', 'Save')
              : t('common.create', 'Create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page Component ──────────────────────────────────────────────

export function PillarsPage() {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPillar, setEditingPillar] = useState<PillarWithCount | null>(null);
  const [provider, setProvider] = useState<LLMProviderId>('openai');
  const [model, setModel] = useState('gpt-4o');
  const [generatingPillarId, setGeneratingPillarId] = useState<string | null>(null);

  const pillarsQuery = usePillars();
  const createMutation = useCreatePillar();
  const updateMutation = useUpdatePillar();
  const deleteMutation = useDeletePillar();
  const generateIdeasMutation = useGenerateIdeas();

  const pillars = pillarsQuery.data || [];
  const isLoading = pillarsQuery.isLoading;

  const handleGenerateIdeas = useCallback(async (pillarId: string) => {
    setGeneratingPillarId(pillarId);
    try {
      await generateIdeasMutation.mutateAsync({ pillarId, params: { provider, model, count: 5 } });
    } finally {
      setGeneratingPillarId(null);
    }
  }, [provider, model, generateIdeasMutation]);

  const handleDeletePillar = (pillar: PillarWithCount) => {
    if (window.confirm(t('pillars.confirmDelete', `Delete "${pillar.name}" and all its ideas?`))) {
      deleteMutation.mutate(pillar.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
              <Columns3 size={22} />
            </div>
            {t('pillars.title', 'Content Pillars')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {t(
              'pillars.subtitle',
              'Organize your content strategy into thematic pillars and manage ideas',
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LLMSelector
            provider={provider}
            model={model}
            onProviderChange={setProvider}
            onModelChange={setModel}
          />
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus size={18} />}
          >
            {t('pillars.addPillar', 'Add Pillar')}
          </Button>
        </div>
      </div>

      {/* Strategy Overview */}
      {pillars.length > 0 && <StrategyStats pillars={pillars} />}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('pillars.loading', 'Loading content pillars...')}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && pillars.length === 0 && (
        <Card className="text-center py-12">
          <div className="space-y-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 mx-auto">
              <Columns3 size={28} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('pillars.emptyTitle', 'No content pillars yet')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t(
                  'pillars.emptyDescription',
                  'Create your first content pillar to organize your content strategy.',
                )}
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              icon={<Plus size={18} />}
            >
              {t('pillars.createFirst', 'Create First Pillar')}
            </Button>
          </div>
        </Card>
      )}

      {/* Pillar Columns (Kanban-like) */}
      {pillars.length > 0 && (
        <div className="flex gap-5 overflow-x-auto pb-4">
          {pillars.map((pillar) => (
            <PillarColumn
              key={pillar.id}
              pillar={pillar}
              onEdit={() => setEditingPillar(pillar)}
              onDelete={() => handleDeletePillar(pillar)}
              onGenerateIdeas={() => handleGenerateIdeas(pillar.id)}
              isGenerating={generatingPillarId === pillar.id}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <PillarModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />

      {/* Edit Modal */}
      <PillarModal
        open={!!editingPillar}
        onClose={() => setEditingPillar(null)}
        pillar={editingPillar}
        onSubmit={(data) => {
          if (editingPillar) {
            updateMutation.mutate({ id: editingPillar.id, data });
          }
        }}
        loading={updateMutation.isPending}
      />
    </div>
  );
}
