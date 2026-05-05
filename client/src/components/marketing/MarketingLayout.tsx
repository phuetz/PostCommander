import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { MarketingHeader } from './MarketingHeader';
import { MarketingFooter } from './MarketingFooter';

export function MarketingLayout() {
  // Force dark mode for marketing pages
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');

    root.classList.add('dark');

    return () => {
      if (!hadDark) {
        root.classList.remove('dark');
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col bg-[var(--color-void)] text-[var(--color-text-primary)]">
      {/* Global grain overlay */}
      <div className="grain fixed inset-0 pointer-events-none z-[100]" />

      <MarketingHeader />
      <main className="flex-1 relative z-0">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}
