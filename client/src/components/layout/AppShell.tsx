import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  children: React.ReactNode;
}

const pageTitles: Record<string, { key: string; fallback: string }> = {
  '/app': { key: 'nav.dashboard', fallback: 'Dashboard' },
  '/app/dashboard': { key: 'nav.dashboard', fallback: 'Dashboard' },
  '/app/generate': { key: 'nav.generate', fallback: 'Generate' },
  '/app/history': { key: 'nav.history', fallback: 'History' },
  '/app/calendar': { key: 'nav.calendar', fallback: 'Calendar' },
  '/app/settings': { key: 'nav.settings', fallback: 'Settings' },
  '/app/viral': { key: 'nav.viral', fallback: 'Viral Library' },
  '/app/hooks': { key: 'nav.hooks', fallback: 'Hook Generator' },
  '/app/carousel': { key: 'nav.carousel', fallback: 'Carousel' },
  '/app/templates': { key: 'nav.templates', fallback: 'Templates' },
  '/app/repurpose': { key: 'nav.repurpose', fallback: 'Repurpose' },
  '/app/hashtags': { key: 'nav.hashtags', fallback: 'Hashtags' },
  '/app/styles': { key: 'nav.styles', fallback: 'Writing Styles' },
  '/app/images': { key: 'nav.images', fallback: 'AI Images' },
  '/app/admin/deleted-accounts': { key: 'nav.deletedAccounts', fallback: 'Deleted Accounts' },
};

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const titleConfig = pageTitles[location.pathname] ?? pageTitles['/app/dashboard'];
  const title = t(titleConfig.key, titleConfig.fallback);

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header title={title} onMenuToggle={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
