import { useState, useMemo } from 'react';
import { Sparkles, BookOpen, Zap, Search, ChevronRight } from 'lucide-react';
import { iconMap } from '../constants/icon-map';
import { AVAILABLE_NODES } from '../constants/available-nodes';
import { ChatPanel } from './ChatPanel';
import type { SidebarProps } from '../types';

const TEMPLATE_METADATA = [
  {
    key: 'rssToLinkedIn',
    name: 'Veille RSS Multi-Réseaux',
    description: 'Surveille un flux RSS, boucle sur les actus pour rédiger par IA et générer une illustration.',
    category: 'curation',
    tags: ['Recommandé', 'Auto'],
    badge: 'RSS',
    steps: ['Rss', 'Bot', 'Image', 'PenTool'],
  },
  {
    key: 'hackerNews',
    name: 'Veille Hacker News (Tech)',
    description: 'Scrape HN, résume les 3 meilleures actus en un post LinkedIn et crée un brouillon.',
    category: 'curation',
    tags: ['Populaire'],
    badge: 'Tech',
    steps: ['Globe', 'Search', 'Bot', 'PenTool'],
  },
  {
    key: 'loopTechNews',
    name: 'Boucle Multi-Articles',
    description: 'Scrape HN, boucle sur les articles pour rédiger un tweet dédié pour chacun et l\'enregistrer.',
    category: 'curation',
    tags: ['Boucle'],
    badge: 'HN',
    steps: ['Globe', 'Search', 'Bot', 'Sparkles', 'PenTool'],
  },
  {
    key: 'blogRepurpose',
    name: 'Recyclage de Blog (Blog Repost)',
    description: 'Extrait le contenu d\'un blog et le transforme en un thread Twitter/X sauvegardé en brouillon.',
    category: 'repurpose',
    tags: ['Populaire'],
    badge: 'Blog',
    steps: ['Globe', 'Search', 'Bot', 'PenTool'],
  },
  {
    key: 'csvImportGenerator',
    name: 'Génération en Lot (CSV)',
    description: 'Lit un fichier CSV d\'idées brutes et boucle sur chaque ligne pour rédiger du contenu.',
    category: 'repurpose',
    tags: ['Import'],
    badge: 'CSV',
    steps: ['Clock', 'BookOpen', 'Bot', 'Sparkles', 'PenTool'],
  },
  {
    key: 'tavilySearchAlert',
    name: 'Recherche Web Tavily',
    description: 'Recherche sur le web par Tavily, puis boucle sur les résultats pour rédiger des analyses.',
    category: 'ai',
    tags: ['Nouveau'],
    badge: 'Tavily',
    steps: ['Clock', 'Compass', 'Bot', 'Database'],
  },
  {
    key: 'toneOptimizer',
    name: 'Optimisation de Ton IA',
    description: 'Recherche et rédige des posts par IA, puis utilise l\'ajusteur de ton pour affiner le style.',
    category: 'ai',
    tags: ['Optimisation'],
    badge: 'Ton',
    steps: ['Clock', 'Compass', 'Bot', 'PenTool', 'PenTool'],
  },
  {
    key: 'webhookApiIntegration',
    name: 'Intégration API & Webhook',
    description: 'Attend un webhook HTTP, interroge une API externe via HTTP GET, puis génère une synthèse.',
    category: 'dev',
    tags: ['Dev'],
    badge: 'API',
    steps: ['Zap', 'ExternalLink', 'Bot', 'PenTool'],
  },
  {
    key: 'autoBloggingCMS',
    name: 'Veille & Publication CMS',
    description: 'Recherche sur le web, rédige un article complet, le formate et le publie sur un CMS.',
    category: 'dev',
    tags: ['Nouveau'],
    badge: 'CMS',
    steps: ['Zap', 'Compass', 'Bot', 'FileText', 'Share2'],
  },
  {
    key: 'youtubeToThread',
    name: 'YouTube to X Thread',
    description: 'Extrait les métadonnées d\'une vidéo YouTube et rédige un thread Twitter/X structuré.',
    category: 'repurpose',
    tags: ['Vidéo', 'X'],
    badge: 'YouTube',
    steps: ['Globe', 'Search', 'Bot', 'PenTool'],
  },
  {
    key: 'linkedinPollAnalysis',
    name: 'Analyse de Sondage LinkedIn',
    description: 'Scrape un sondage ou post LinkedIn, analyse l\'engagement par l\'IA et stocke le rapport.',
    category: 'ai',
    tags: ['Rapport', 'LinkedIn'],
    badge: 'Sondage',
    steps: ['Globe', 'Search', 'Bot', 'Database'],
  },
  {
    key: 'outreachEmailGenerator',
    name: 'B2B Email Outreach Generator',
    description: 'Analyse le site web d\'une entreprise cible pour rédiger un email d\'approche personnalisé.',
    category: 'dev',
    tags: ['B2B', 'Sales'],
    badge: 'Outreach',
    steps: ['Globe', 'Search', 'Bot', 'PenTool'],
  },
];

const CATEGORY_COLORS: Record<string, { badge: string; border: string; text: string }> = {
  curation: {
    badge: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30',
    border: 'hover:border-emerald-500/50 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10',
    text: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
  },
  repurpose: {
    badge: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30',
    border: 'hover:border-indigo-500/50 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10',
    text: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
  },
  ai: {
    badge: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30',
    border: 'hover:border-amber-500/50 hover:bg-amber-50/10 dark:hover:bg-amber-950/10',
    text: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
  },
  dev: {
    badge: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/30',
    border: 'hover:border-purple-500/50 hover:bg-purple-50/10 dark:hover:bg-purple-950/10',
    text: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
  },
};

export function Sidebar({
  activeTab,
  setActiveTab,
  onLoadTemplate,
  nodes,
  edges,
  onWorkflowUpdated,
  automationId,
  onAutomationCreated,
  chatSessionId,
  onChatSessionChange,
}: SidebarProps) {
  const [templateQuery, setTemplateQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const onDragStart = (event: React.DragEvent, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredTemplates = useMemo(() => {
    const q = templateQuery.toLowerCase().trim();
    return TEMPLATE_METADATA.filter((t) => {
      const matchQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.badge.toLowerCase().includes(q);
      const matchCat = selectedCategory === 'all' || t.category === selectedCategory;
      return matchQuery && matchCat;
    });
  }, [templateQuery, selectedCategory]);

  return (
    <aside className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full z-10 relative shrink-0">
      {/* Tabs Header */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <button
          onClick={() => setActiveTab('toolbox')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
            activeTab === 'toolbox'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Outils
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
            activeTab === 'guide'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Modèles
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-1 ${
            activeTab === 'chat'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <Sparkles size={11} className={activeTab === 'chat' ? 'text-brand-500 animate-pulse' : ''} />
          Chat IA
        </button>
      </div>

      {activeTab === 'chat' ? (
        <ChatPanel
          automationId={automationId}
          nodes={nodes}
          edges={edges}
          onWorkflowUpdated={onWorkflowUpdated}
          onAutomationCreated={onAutomationCreated}
          activeSessionId={chatSessionId}
          onActiveSessionChange={onChatSessionChange}
        />
      ) : (
        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'toolbox' ? (
            <ToolboxContent onDragStart={onDragStart} />
          ) : (
            <div className="space-y-6">
              {/* 1-Click Templates */}
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-amber-500 animate-pulse" /> Galerie de Modèles
                </h3>
                <p className="text-[10px] text-gray-500 mb-3">Sélectionnez un modèle pour charger le workflow.</p>

                {/* Filter and Search */}
                <div className="relative mb-2.5">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={templateQuery}
                    onChange={(e) => setTemplateQuery(e.target.value)}
                    placeholder="Rechercher un modèle..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 focus:border-brand-500 outline-none text-gray-850 dark:text-gray-100 placeholder-gray-400"
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto pb-2 mb-3 no-scrollbar">
                  {[
                    { id: 'all', label: 'Tout' },
                    { id: 'curation', label: 'Veille' },
                    { id: 'repurpose', label: 'Recyclage' },
                    { id: 'ai', label: 'IA' },
                    { id: 'dev', label: 'Dev' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2 py-1 rounded-md text-[9px] font-bold tracking-wide uppercase shrink-0 transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'bg-gray-50 dark:bg-gray-850 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
                  {filteredTemplates.map((template) => {
                    const colors = CATEGORY_COLORS[template.category] || CATEGORY_COLORS.curation;
                    return (
                      <button
                        key={template.key}
                        onClick={() => onLoadTemplate(template.key)}
                        className={`w-full text-left p-3 rounded-xl border border-gray-200 dark:border-gray-800/80 bg-gray-50/30 dark:bg-gray-900/30 hover:shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 group flex flex-col justify-between ${colors.border}`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold border ${colors.badge}`}>
                              {template.badge}
                            </span>
                            <div className="flex flex-wrap gap-1 justify-end">
                              {template.tags.map((tag) => (
                                <span key={tag} className="text-[8px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1 py-0.2 rounded font-medium">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <h4 className={`text-[11px] font-bold text-gray-800 dark:text-gray-200 mt-2 transition-colors ${colors.text}`}>
                            {template.name}
                          </h4>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                            {template.description}
                          </p>
                        </div>

                        {/* Steps flow visuals */}
                        <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800/40 overflow-x-auto no-scrollbar w-full">
                          {template.steps.map((iconName, idx) => {
                            const Icon = iconMap[iconName] || Zap;
                            return (
                              <div key={idx} className="flex items-center gap-1 shrink-0">
                                {idx > 0 && <ChevronRight size={10} className="text-gray-300 dark:text-gray-700" />}
                                <div className="p-1 rounded bg-gray-100 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400" title={iconName}>
                                  <Icon size={11} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </button>
                    );
                  })}
                  {filteredTemplates.length === 0 && (
                    <div className="text-[11px] text-gray-400 italic text-center py-4">Aucun modèle correspondant.</div>
                  )}
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-800" />

              {/* Guided Help */}
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-1.5">
                  <BookOpen size={16} className="text-brand-500" /> Guide de construction
                </h3>
                <div className="space-y-4 text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  <div className="relative pl-6">
                    <span className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-[9px] font-bold text-brand-600 dark:text-brand-400">
                      1
                    </span>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Cibler</p>
                    <p className="mt-0.5">
                      Glissez le nœud <strong>Cibler URL</strong>. Double-cliquez dessus pour configurer l'URL de
                      départ.
                    </p>
                  </div>

                  <div className="relative pl-6">
                    <span className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-[9px] font-bold text-brand-600 dark:text-brand-400">
                      2
                    </span>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Extraire</p>
                    <p className="mt-0.5">
                      Glissez <strong>Scraper (Stagehand)</strong>. Décrivez ce que vous voulez (ex: <i>"prends le
                      titre et le lien"</i>).
                    </p>
                  </div>

                  <div className="relative pl-6">
                    <span className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-[9px] font-bold text-brand-600 dark:text-brand-400">
                      3
                    </span>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Traiter</p>
                    <p className="mt-0.5">
                      Glissez <strong>Traiter (LLM)</strong> et donnez les instructions IA (ex: <i>"rédige un post
                      Linkedin"</i>).
                    </p>
                  </div>

                  <div className="relative pl-6">
                    <span className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-[9px] font-bold text-brand-600 dark:text-brand-400">
                      4
                    </span>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Enregistrer</p>
                    <p className="mt-0.5">
                      Glissez <strong>Créer un Brouillon</strong> pour enregistrer automatiquement le post généré
                      dans PostCommander.
                    </p>
                  </div>

                  <div className="relative pl-6">
                    <span className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-[9px] font-bold text-brand-600 dark:text-brand-400">
                      5
                    </span>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Relier & Lancer</p>
                    <p className="mt-0.5">
                      Reliez les nœuds en faisant glisser le point bleu inférieur vers le point gris supérieur.
                      Sauvegardez et cliquez sur tester !
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

interface ToolboxContentProps {
  onDragStart: (event: React.DragEvent, nodeData: any) => void;
}

function ToolboxContent({ onDragStart }: ToolboxContentProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return AVAILABLE_NODES;
    return AVAILABLE_NODES.filter(
      (n) => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q),
    );
  }, [query]);

  const groups = (['trigger', 'logic', 'action'] as const).map((groupType) => ({
    groupType,
    items: filtered.filter((n) => n.type === groupType),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">Boîte à outils</h3>
        <p className="text-xs text-gray-500 mb-3">Glissez les éléments sur le canevas.</p>
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un nœud…"
            className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 focus:border-brand-500 outline-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        {groups.map(({ groupType, items }) => {
          if (items.length === 0) return null;
          return (
            <div key={groupType}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                {groupType === 'trigger' ? 'Déclencheurs' : groupType === 'action' ? 'Actions' : 'Logique'}
              </h4>
              <div className="space-y-2">
                {items.map((node) => {
                  const NodeIcon = iconMap[node.iconName] || Zap;
                  return (
                    <div
                      key={node.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-brand-300 dark:hover:border-brand-700 cursor-grab active:cursor-grabbing transition-colors"
                      onDragStart={(event) => onDragStart(event, node)}
                      draggable
                    >
                      <NodeIcon
                        size={16}
                        className={
                          groupType === 'trigger'
                            ? 'text-emerald-500'
                            : groupType === 'action'
                              ? 'text-brand-500'
                              : 'text-amber-500'
                        }
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{node.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-[11px] text-gray-400 italic">Aucun nœud pour "{query}"</div>
        )}
      </div>
    </div>
  );
}
