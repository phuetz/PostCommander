import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Sparkles,
  Clock,
  CalendarDays,
  Settings,
  X,
  Zap,
  CreditCard,
  Flame,
  Layers,
  FileText,
  RefreshCw,
  Hash,
  Palette,
  Image,
  FlaskConical,
  Gauge,
  TrendingUp,
  Columns3,
  Activity,
  Shield,
  Briefcase,
  Check,
  ChevronsUpDown,
  GitFork,
  Bot,
  ClipboardCheck,
  Inbox,
  Home,
  Wand2,
  BarChart3,
  Mic,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useUIMode } from '@/hooks/useUIMode';
import { ToggleLeft, ToggleRight } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const workflowNavItems = [
  { to: '/app', icon: Home, labelKey: 'nav.hub' },
  { to: '/app/w/post', icon: Wand2, labelKey: 'nav.wizardPost' },
  { to: '/app/w/autoblog', icon: Bot, labelKey: 'nav.wizardAutoblog' },
  { to: '/app/w/outreach', icon: Target, labelKey: 'nav.wizardOutreach' },
  { to: '/app/w/analytics', icon: BarChart3, labelKey: 'nav.wizardAnalytics' },
] as const;

const mainNavItems = [
  { to: '/app/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/app/inbox', icon: Inbox, labelKey: 'nav.inbox' },
  { to: '/app/approvals', icon: ClipboardCheck, labelKey: 'nav.approvals' },
  { to: '/app/generate', icon: Sparkles, labelKey: 'nav.generate' },
  { to: '/app/history', icon: Clock, labelKey: 'nav.history' },
  { to: '/app/calendar', icon: CalendarDays, labelKey: 'nav.calendar' },
] as const;

import { Target } from 'lucide-react';

const toolNavItems = [
  { to: '/app/viral', icon: Flame, labelKey: 'nav.viral' },
  { to: '/app/hooks', icon: Zap, labelKey: 'nav.hooks' },
  { to: '/app/carousel', icon: Layers, labelKey: 'nav.carousel' },
  { to: '/app/templates', icon: FileText, labelKey: 'nav.templates' },
  { to: '/app/repurpose', icon: RefreshCw, labelKey: 'nav.repurpose' },
  { to: '/app/hashtags', icon: Hash, labelKey: 'nav.hashtags' },
  { to: '/app/styles', icon: Palette, labelKey: 'nav.styles' },
  { to: '/app/images', icon: Image, labelKey: 'nav.images' },
  { to: '/app/voice-studio', icon: Mic, labelKey: 'Studio Vocal' },
  { to: '/app/autoblog', icon: Bot, labelKey: 'nav.autoblog' },
  { to: '/app/outreach', icon: Target, labelKey: 'nav.outreach' },
] as const;


const strategyNavItems = [
  { to: '/app/analytics', icon: TrendingUp, labelKey: 'nav.analytics' },
  { to: '/app/automations', icon: GitFork, labelKey: 'Automations (Beta)' },
  { to: '/app/ab-test', icon: FlaskConical, labelKey: 'nav.abTest' },
  { to: '/app/engagement', icon: Gauge, labelKey: 'nav.engagement' },
  { to: '/app/trending', icon: TrendingUp, labelKey: 'nav.trending' },
  { to: '/app/pillars', icon: Columns3, labelKey: 'nav.pillars' },
  { to: '/app/simulator', icon: Activity, labelKey: 'nav.simulator' },
] as const;

const bottomNavItems = [
  { to: '/app/billing', icon: CreditCard, labelKey: 'nav.billing' },
  { to: '/app/settings', icon: Settings, labelKey: 'nav.settings' },
] as const;

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId } = useWorkspace();
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const { mode, toggle, isSimple } = useUIMode();

  const renderNavLink = (item: { to: string; icon: React.ElementType; labelKey: string }) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/app'}
      onClick={onClose}
      onMouseEnter={() => {
        import('@/utils/routePrefetch').then(({ prefetchRoute }) => {
          prefetchRoute(item.to);
        });
      }}
      className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}
    >
      <item.icon size={20} />
      <span>{t(item.labelKey, item.labelKey.split('.')[1])}</span>
    </NavLink>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 text-white">
            <Zap size={18} />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Post<span className="text-brand-600">Commander</span>
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Workspace Switcher */}
      <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-800 relative">
        <button
          onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors text-left"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
              <Briefcase size={14} />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {workspaces.find((w) => w.id === activeWorkspaceId)?.name || 'Loading...'}
            </span>
          </div>
          <ChevronsUpDown size={14} className="text-gray-400 flex-shrink-0 ml-2" />
        </button>

        {showWorkspaceDropdown && (
          <div className="absolute top-full left-3 right-3 mt-1 py-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-50">
            <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t('workspace.select', 'Workspaces')}
            </div>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveWorkspaceId(ws.id);
                  setShowWorkspaceDropdown(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <span className="truncate">{ws.name}</span>
                {ws.id === activeWorkspaceId && <Check size={14} className="text-brand-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {/* Workflows section (Hub + wizards) — always visible */}
        <div className="space-y-1">{workflowNavItems.map(renderNavLink)}</div>

        {/* Expert-only sections */}
        {!isSimple && (
          <>
            <div className="mt-6">
              <div className="px-3 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {t('nav.advanced', 'Pages avancées')}
                </span>
              </div>
              <div className="space-y-1">{mainNavItems.map(renderNavLink)}</div>
            </div>

            <div className="mt-6">
              <div className="px-3 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {t('nav.tools', 'Tools')}
                </span>
              </div>
              <div className="space-y-1">{toolNavItems.map(renderNavLink)}</div>
            </div>

            <div className="mt-6">
              <div className="px-3 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {t('nav.strategy', 'Strategy')}
                </span>
              </div>
              <div className="space-y-1">{strategyNavItems.map(renderNavLink)}</div>
            </div>
          </>
        )}

        {/* Bottom section — always visible (Settings, Billing) */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
          {bottomNavItems.map(renderNavLink)}
        </div>

        {/* Mode toggle */}
        <button
          type="button"
          onClick={toggle}
          className="mt-4 w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
          aria-label={isSimple ? 'Activer le mode Expert' : 'Activer le mode Simple'}
          title={isSimple ? 'Afficher toutes les pages avancées' : 'Masquer les pages avancées'}
        >
          <span className="flex items-center gap-2">
            {isSimple ? <ToggleLeft size={18} /> : <ToggleRight size={18} className="text-violet-500" />}
            <span className="text-xs font-medium uppercase tracking-wider">
              {isSimple ? t('nav.modeSimple', 'Mode Simple') : t('nav.modeExpert', 'Mode Expert')}
            </span>
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {isSimple ? '→ Expert' : '→ Simple'}
          </span>
        </button>

        {isAdmin && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="px-3 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t('nav.admin', 'Admin')}
              </span>
            </div>
            <div className="space-y-1">
              {renderNavLink({
                to: '/app/admin/deleted-accounts',
                icon: Shield,
                labelKey: 'nav.deletedAccounts',
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs text-gray-400 dark:text-gray-500">PostCommander v1.0</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        {sidebarContent}
      </aside>
    </>
  );
}
