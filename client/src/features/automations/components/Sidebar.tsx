import { useState, useMemo } from 'react';
import { Sparkles, BookOpen, Zap, Search } from 'lucide-react';
import { iconMap } from '../constants/icon-map';
import { AVAILABLE_NODES } from '../constants/available-nodes';
import { ChatPanel } from './ChatPanel';
import type { SidebarProps } from '../types';

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
  const onDragStart = (event: React.DragEvent, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

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
          Guide
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
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1.5 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-amber-500 animate-pulse" /> Bibliothèque de Modèles
                </h3>
                <p className="text-[11px] text-gray-500 mb-4">Chargez un workflow prêt à l'emploi en 1 clic.</p>

                <div className="space-y-4">
                  {/* Catégorie : Curation & Veille */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                      Curation & Veille
                    </h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => onLoadTemplate('rssToLinkedIn')}
                        className="w-full text-left p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 transition-all group"
                      >
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-1.5">
                          Veille RSS Multi-Réseaux
                          <span className="text-[8px] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-1 py-0.2 rounded font-mono font-bold">RSS</span>
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          Surveille un flux RSS, boucle sur chaque article pour rédiger par IA, génère une image et crée un brouillon.
                        </div>
                      </button>

                      <button
                        onClick={() => onLoadTemplate('hackerNews')}
                        className="w-full text-left p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 transition-all group"
                      >
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          Veille Hacker News (Tech)
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          Scrape HN, résume les 3 premières actus en un post LinkedIn et crée un brouillon.
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Catégorie : Recyclage de Contenu */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-650 dark:text-brand-400 mb-2">
                      Recyclage & Génération
                    </h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => onLoadTemplate('blogRepurpose')}
                        className="w-full text-left p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/10 dark:hover:bg-brand-950/10 transition-all group"
                      >
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                          Recyclage de Blog (Blog Repost)
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          Extrait le contenu d'un blog et le transforme en un thread Twitter/X sauvegardé en brouillon.
                        </div>
                      </button>

                      <button
                        onClick={() => onLoadTemplate('csvImportGenerator')}
                        className="w-full text-left p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/10 dark:hover:bg-brand-950/10 transition-all group"
                      >
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 flex items-center gap-1.5">
                          Génération en Lot (CSV)
                          <span className="text-[8px] bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 px-1 py-0.2 rounded font-mono font-bold">CSV</span>
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          Lit un fichier CSV d'idées brutes et boucle sur chaque ligne pour rédiger du contenu.
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Catégorie : Intelligence & Analyse */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                      Analyse & Optimisation
                    </h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => onLoadTemplate('tavilySearchAlert')}
                        className="w-full text-left p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/10 dark:hover:bg-amber-950/10 transition-all group"
                      >
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-amber-650 dark:group-hover:text-amber-400 flex items-center gap-1.5">
                          Recherche Web Tavily
                          <span className="text-[8px] bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-450 px-1 py-0.2 rounded font-mono font-bold">Tavily</span>
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          Recherche sur le web par Tavily, puis boucle sur les résultats pour rédiger des analyses en base.
                        </div>
                      </button>

                      <button
                        onClick={() => onLoadTemplate('toneOptimizer')}
                        className="w-full text-left p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/10 dark:hover:bg-amber-950/10 transition-all group"
                      >
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-amber-650 dark:group-hover:text-amber-400 flex items-center gap-1.5">
                          Optimisation de Ton IA
                          <span className="text-[8px] bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-450 px-1 py-0.2 rounded font-mono font-bold">Ton</span>
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          Recherche et rédige des posts par IA, puis utilise l'ajusteur de ton pour affiner le style avant enregistrement.
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Catégorie : Intégrations Techniques */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-purple-650 dark:text-purple-400 mb-2">
                      Intégrations & Dev
                    </h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => onLoadTemplate('webhookApiIntegration')}
                        className="w-full text-left p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50/10 dark:hover:bg-purple-950/10 transition-all group"
                      >
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center gap-1.5">
                          Intégration API & Webhook
                          <span className="text-[8px] bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 px-1 py-0.2 rounded font-mono font-bold">API</span>
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          Attend un webhook HTTP, interroge une API externe via HTTP GET, puis génère une synthèse LinkedIn.
                        </div>
                      </button>
                    </div>
                  </div>
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
