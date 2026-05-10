import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Plus, Play, Pause, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
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

export function AutoBlogPage() {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<AutoBlogConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [topic, setTopic] = useState('');
  const [articleType, setArticleType] = useState('fond-technique');
  const [frequency, setFrequency] = useState('daily');
  const [provider, setProvider] = useState<LLMProviderId>('openai');
  const [model, setModel] = useState('gpt-4o');
  const [authorName, setAuthorName] = useState('Patrice Huetz');
  const [authorRole, setAuthorRole] = useState('architecte logiciel');
  const [authorReferences, setAuthorReferences] = useState('La Boucle Ralph, GitNexus');

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
    if (!topic.trim()) {
      toast.error('Le sujet est requis');
      return;
    }
    try {
      await createAutoBlogConfig({
        topic,
        articleType,
        frequency,
        provider,
        model,
        authorName,
        authorRole,
        authorReferences,
        status: 'active',
      });
      toast.success('Moteur de création automatique activé !');
      setIsCreating(false);
      setTopic('');
      fetchConfigs();
    } catch (err) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      await updateAutoBlogConfig(id, {
        status: currentStatus === 'active' ? 'paused' : 'active',
      });
      fetchConfigs();
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce moteur ?')) return;
    try {
      await deleteAutoBlogConfig(id);
      fetchConfigs();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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

      {isCreating && (
        <Card className="border-brand-500 border-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Nouveau Moteur Autopilot</h2>
            
            <Input
              label="Sujet / Thème principal"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="ex: Les tendances de l'IA générative"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type d'Article</label>
                <select
                  value={articleType}
                  onChange={(e) => setArticleType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="fond-technique">Fond Technique</option>
                  <option value="news-comment">News Commentée</option>
                  <option value="opinion-perso">Opinion Perso</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fréquence</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="daily">Quotidien</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="biweekly">Bi-mensuel</option>
                </select>
              </div>
            </div>

            <LLMSelector
              provider={provider}
              model={model}
              onProviderChange={setProvider}
              onModelChange={setModel}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nom de l'auteur"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
              <Input
                label="Rôle / Expertise"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
              />
            </div>
            
            <TextArea
              label="Références Catalogue (séparées par des virgules)"
              value={authorReferences}
              onChange={(e) => setAuthorReferences(e.target.value)}
              placeholder="Ex: La Boucle Ralph, GitNexus..."
              rows={2}
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>Annuler</Button>
              <Button onClick={handleCreate}>Créer et Activer</Button>
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
                  >
                    {config.status === 'active' ? 'Pause' : 'Reprendre'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    icon={<Trash2 size={16} />}
                    onClick={() => handleDelete(config.id)}
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
  );
}
