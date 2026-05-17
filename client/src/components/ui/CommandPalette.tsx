import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  PenTool, 
  Calendar, 
  Settings, 
  History, 
  BarChart2, 
  Sparkles, 
  Image as ImageIcon,
  BookOpen,
  Send,
  Users,
  LayoutDashboard,
  Bot
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';

interface Command {
  id: string;
  name: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  keywords: string[];
  category: 'navigation' | 'action' | 'recent';
  shortcut?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Handle Ctrl+K / Cmd+K toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const close = () => setIsOpen(false);

  const executeCommand = (cmd: Command) => {
    close();
    setTimeout(() => {
      cmd.action();
    }, 150);
  };

  const commands = useMemo<Command[]>(() => [
    {
      id: 'nav-dashboard',
      name: 'Tableau de bord',
      description: "Vue d'ensemble",
      icon: LayoutDashboard,
      action: () => navigate('/app/dashboard'),
      keywords: ['home', 'accueil', 'dashboard', 'stats'],
      category: 'navigation'
    },
    {
      id: 'nav-generate',
      name: 'Créer un post',
      description: "Lancer le générateur complet",
      icon: PenTool,
      action: () => navigate('/app/generate'),
      keywords: ['nouveau', 'post', 'écrire', 'générer'],
      category: 'action',
      shortcut: 'C'
    },
    {
      id: 'nav-autoblog',
      name: 'Autopilot (Blog)',
      description: "Configurer la génération automatique",
      icon: Bot,
      action: () => navigate('/app/autoblog'),
      keywords: ['auto', 'blog', 'moteur', 'autopilot'],
      category: 'navigation'
    },
    {
      id: 'nav-outreach',
      name: 'Campagnes Outreach',
      description: "Gérer la prospection automatique",
      icon: Send,
      action: () => navigate('/app/outreach'),
      keywords: ['outreach', 'campagne', 'prospection', 'leads'],
      category: 'navigation'
    },
    {
      id: 'nav-calendar',
      name: 'Calendrier',
      description: "Planning de publication",
      icon: Calendar,
      action: () => navigate('/app/calendar'),
      keywords: ['planning', 'dates', 'agenda'],
      category: 'navigation'
    },
    {
      id: 'nav-history',
      name: 'Historique',
      description: "Brouillons et posts précédents",
      icon: History,
      action: () => navigate('/app/history'),
      keywords: ['brouillons', 'drafts', 'anciens'],
      category: 'navigation'
    },
    {
      id: 'nav-engagement',
      name: 'Analytiques',
      description: "Performances et engagement",
      icon: BarChart2,
      action: () => navigate('/app/engagement'),
      keywords: ['stats', 'performances', 'kpi'],
      category: 'navigation'
    },
    {
      id: 'nav-images',
      name: 'Générateur d\'images',
      description: "Créer des visuels avec l'IA",
      icon: ImageIcon,
      action: () => navigate('/app/images'),
      keywords: ['images', 'dalle', 'midjourney', 'visuels'],
      category: 'action'
    },
    {
      id: 'nav-templates',
      name: 'Templates',
      description: "Modèles de prompts personnalisés",
      icon: BookOpen,
      action: () => navigate('/app/templates'),
      keywords: ['prompts', 'modèles'],
      category: 'navigation'
    },
    {
      id: 'nav-hooks',
      name: 'Générateur d\'accroches',
      description: "Trouver la bonne première phrase",
      icon: Sparkles,
      action: () => navigate('/app/hooks'),
      keywords: ['hooks', 'accroches', 'titres'],
      category: 'action'
    },
    {
      id: 'action-settings',
      name: 'Paramètres',
      description: "Configuration du compte et de l'espace",
      icon: Settings,
      action: () => navigate('/app/settings'),
      keywords: ['config', 'préférences', 'profil'],
      category: 'navigation',
      shortcut: ','
    },
    {
      id: 'action-logout',
      name: 'Se déconnecter',
      icon: Users,
      action: () => logout(),
      keywords: ['quitter', 'déconnexion', 'logout'],
      category: 'action'
    }
  ], [navigate, logout]);

  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd => {
      const matchName = cmd.name.toLowerCase().includes(lowerQuery);
      const matchDesc = cmd.description?.toLowerCase().includes(lowerQuery);
      const matchKeyword = cmd.keywords.some(k => k.toLowerCase().includes(lowerQuery));
      return matchName || matchDesc || matchKeyword;
    });
  }, [query, commands]);

  // Handle keyboard navigation inside the list
  useEffect(() => {
    const handleListKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
      }
    };
    window.addEventListener('keydown', handleListKeyDown);
    return () => window.removeEventListener('keydown', handleListKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={close}
          />
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto border border-gray-200 dark:border-gray-800"
            >
              {/* Search Header */}
              <div className="flex items-center px-4 border-b border-gray-100 dark:border-gray-800">
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une action, une page... (Ex: Créer post)"
                  className="w-full bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 py-4 px-3 text-lg outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center justify-center h-6 px-2 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded-md shrink-0">
                  ESC
                </kbd>
              </div>

              {/* Results List */}
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {filteredCommands.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p className="font-medium text-gray-900 dark:text-gray-100">Aucun résultat trouvé</p>
                    <p className="text-sm">Essayez de chercher autre chose.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {filteredCommands.map((cmd, idx) => {
                      const Icon = cmd.icon;
                      const active = idx === selectedIndex;
                      return (
                        <div
                          key={cmd.id}
                          className={clsx(
                            "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors",
                            active 
                              ? "bg-brand-50 dark:bg-brand-900/30 text-brand-900 dark:text-brand-100" 
                              : "hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300"
                          )}
                          onClick={() => executeCommand(cmd)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={clsx(
                              "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                              active ? "bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                            )}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{cmd.name}</span>
                              {cmd.description && (
                                <span className={clsx(
                                  "text-xs",
                                  active ? "text-brand-700/70 dark:text-brand-300/70" : "text-gray-500 dark:text-gray-500"
                                )}>
                                  {cmd.description}
                                </span>
                              )}
                            </div>
                          </div>
                          {cmd.shortcut && (
                            <kbd className={clsx(
                              "hidden sm:inline-flex items-center justify-center min-w-[24px] h-6 px-1 text-xs font-semibold rounded-md",
                              active 
                                ? "bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-300" 
                                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                            )}>
                              {cmd.shortcut}
                            </kbd>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <kbd className="inline-flex items-center justify-center w-5 h-5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">↑</kbd>
                    <kbd className="inline-flex items-center justify-center w-5 h-5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">↓</kbd>
                    <span>Naviguer</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="inline-flex items-center justify-center px-1.5 h-5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">↵</kbd>
                    <span>Valider</span>
                  </span>
                </div>
                <div>PostCommander AI</div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
