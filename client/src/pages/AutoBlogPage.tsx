import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Plus, Play, Pause, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TextArea } from '@/components/ui/TextArea';
import { LLMSelector } from '@/components/post/LLMSelector';
import toast from 'react-hot-toast';
import {
  getAutoBlogConfigs,
  createAutoBlogConfig,
  updateAutoBlogConfig,
  deleteAutoBlogConfig,
  type AutoBlogConfig,
} from '@/services/autoblog';
import type { LLMProviderId } from '@postcommander/shared';
import { LiveTerminal } from '@/components/ui/LiveTerminal';
import { useAgentStream } from '@/hooks/useAgentStream';

export function AutoBlogPage() {
  const { logs, isConnected } = useAgentStream('autoblog');
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<AutoBlogConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    topic: '',
    articleType: 'fond-technique',
    frequency: 'daily',
    provider: 'openai' as LLMProviderId,
    model: 'gpt-4o',
    authorName: 'Patrice Huetz',
    authorRole: 'architecte logiciel',
    authorReferences: 'La Boucle Ralph, GitNexus',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionStates, setActionStates] = useState<Record<string, { type: 'toggle' | 'delete', loading: boolean }>>({});

  const fetchConfigs = async () => {
    try {
      const data = await getAutoBlogConfigs();
      setConfigs(data);
    } catch (err) {
      toast.error('Erreur lors du chargement des configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleCreate = async () => {
    if (!formData.topic.trim()) {
      toast.error('Le sujet est requis');
      return;
    }
    setIsSubmitting(true);
    try {
      await createAutoBlogConfig({
        ...formData,
        status: 'active',
      });
      toast.success('Moteur de création automatique activé !');
      setIsCreating(false);
      setFormData((prev) => ({ ...prev, topic: '' }));
      fetchConfigs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    setActionStates((prev) => ({ ...prev, [id]: { type: 'toggle', loading: true } }));
    try {
      await updateAutoBlogConfig(id, {
        status: currentStatus === 'active' ? 'paused' : 'active',
      });
      fetchConfigs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Erreur lors de la mise à jour');
    } finally {
      setActionStates((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce moteur ?')) return;
    setActionStates((prev) => ({ ...prev, [id]: { type: 'delete', loading: true } }));
    try {
      await deleteAutoBlogConfig(id);
      fetchConfigs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Erreur lors de la suppression');
    } finally {
      setActionStates((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bot className="text-brand-500" />
            Autopilot (Blog)
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Générez des articles de blog automatiquement en tâche de fond.
          </p>
        </div>
        {!isCreating && (
          <Button icon={<Plus size={18} />} onClick={() => setIsCreating(true)}>
            Nouveau Moteur
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {isCreating && (
            <Card className="border-brand-500 border-2">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Nouveau Moteur Autopilot</h2>
                
                <Input
                  label="Sujet / Thème principal"
                  value={formData.topic}
                  onChange={(e) => setFormData((prev) => ({ ...prev, topic: e.target.value }))}
                  placeholder="ex: Les tendances de l'IA générative"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Type d'Article"
                    value={formData.articleType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, articleType: e.target.value }))}
                    options={[
                      { value: 'fond-technique', label: 'Fond Technique' },
                      { value: 'news-comment', label: 'News Commentée' },
                      { value: 'opinion-perso', label: 'Opinion Perso' }
                    ]}
                  />
                  <Select
                    label="Fréquence"
                    value={formData.frequency}
                    onChange={(e) => setFormData((prev) => ({ ...prev, frequency: e.target.value }))}
                    options={[
                      { value: 'daily', label: 'Quotidien' },
                      { value: 'weekly', label: 'Hebdomadaire' },
                      { value: 'biweekly', label: 'Bi-mensuel' }
                    ]}
                  />
                </div>

                <LLMSelector
                  provider={formData.provider}
                  model={formData.model}
                  onProviderChange={(provider) => setFormData((prev) => ({ ...prev, provider }))}
                  onModelChange={(model) => setFormData((prev) => ({ ...prev, model }))}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nom de l'auteur"
                    value={formData.authorName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, authorName: e.target.value }))}
                  />
                  <Input
                    label="Rôle / Expertise"
                    value={formData.authorRole}
                    onChange={(e) => setFormData((prev) => ({ ...prev, authorRole: e.target.value }))}
                  />
                </div>
                
                <TextArea
                  label="Références Catalogue (séparées par des virgules)"
                  value={formData.authorReferences}
                  onChange={(e) => setFormData((prev) => ({ ...prev, authorReferences: e.target.value }))}
                  placeholder="Ex: La Boucle Ralph, GitNexus..."
                  rows={2}
                />

                <div className="flex gap-3 justify-end pt-4">
                  <Button variant="ghost" onClick={() => setIsCreating(false)} disabled={isSubmitting}>Annuler</Button>
                  <Button onClick={handleCreate} loading={isSubmitting}>Créer et Activer</Button>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            {loading ? (
              <p>Chargement...</p>
            ) : configs.length === 0 && !isCreating ? (
              <Card className="text-center py-12">
                <Bot size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucun moteur actif</h3>
                <p className="text-gray-500 mt-2">Créez votre premier moteur pour commencer à générer du contenu automatiquement.</p>
              </Card>
            ) : (
              configs.map((config) => (
                <Card key={config.id} className={config.status === 'paused' ? 'opacity-75' : ''}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{config.topic}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          config.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {config.status === 'active' ? 'Actif' : 'En pause'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Fréquence: {config.frequency} • Modèle: {config.model} • Type: {config.articleType}
                      </p>
                      <p className="text-sm text-gray-500">
                        Auteur: {config.authorName} ({config.authorRole})
                      </p>
                      {config.lastGeneratedAt && (
                        <p className="text-xs text-gray-400 mt-2">
                          Dernière génération : {new Date(config.lastGeneratedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        icon={config.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                        onClick={() => handleToggleStatus(config.id, config.status)}
                        loading={actionStates[config.id]?.type === 'toggle' && actionStates[config.id]?.loading}
                        disabled={actionStates[config.id]?.loading}
                      >
                        {config.status === 'active' ? 'Pause' : 'Reprendre'}
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        icon={<Trash2 size={16} />}
                        onClick={() => handleDelete(config.id)}
                        loading={actionStates[config.id]?.type === 'delete' && actionStates[config.id]?.loading}
                        disabled={actionStates[config.id]?.loading}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1 min-h-[500px]">
          <LiveTerminal logs={logs} isConnected={isConnected} title="Autopilot / IA" />
        </div>
      </div>
    </div>
  );
}
