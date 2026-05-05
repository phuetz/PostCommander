import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, ArrowRight, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export function MarketingHeader() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { to: '/demo', label: t('marketing.nav.demo', 'Demo') },
    { to: '/features', label: t('marketing.nav.features', 'Features') },
    { to: '/pricing', label: t('marketing.nav.pricing', 'Pricing') },
    { to: '/compare', label: t('marketing.nav.compare', 'Compare') },
    { to: '/enterprise', label: t('marketing.nav.enterprise', 'Enterprise') },
  ];

  const moreLinks = [
    { to: '/use-cases', label: t('marketing.nav.useCases', 'Use Cases') },
    { to: '/integrations', label: t('marketing.nav.integrations', 'Integrations') },
    { to: '/testimonials', label: t('marketing.nav.testimonials', 'Testimonials') },
    { to: '/partners', label: t('marketing.nav.partners', 'Partners') },
    { to: '/blog', label: t('marketing.nav.blog', 'Blog') },
    { to: '/about', label: t('marketing.nav.about', 'About') },
    { to: '/faq', label: t('marketing.nav.faq', 'FAQ') },
    { to: '/changelog', label: t('marketing.nav.changelog', 'Changelog') },
    { to: '/contact', label: t('marketing.nav.contact', 'Contact') },
  ];

  const allMobileLinks = [...navLinks, ...moreLinks];

  const isMoreActive = moreLinks.some((l) => location.pathname === l.to);

  return (
    <>
      <header
        className={clsx(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled
            ? 'bg-[var(--color-void)]/80 backdrop-blur-2xl border-b border-white/[0.06]'
            : 'bg-transparent',
        )}
      >
        {/* Animated gradient border at the bottom */}
        <div
          className={clsx(
            'absolute bottom-0 left-0 right-0 h-px transition-opacity duration-500',
            scrolled ? 'opacity-100' : 'opacity-0',
          )}
          style={{
            background: 'linear-gradient(90deg, transparent, var(--color-accent-blue), var(--color-accent-violet), var(--color-accent-magenta), transparent)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-1 shrink-0 group">
              <span className="font-display text-xl font-extrabold text-white tracking-tight">
                Post
              </span>
              <span className="font-display text-xl font-extrabold gradient-text-brand tracking-tight">
                Commander
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={clsx(
                    'relative px-4 py-2 text-sm font-medium transition-colors duration-200 group',
                    location.pathname === link.to
                      ? 'text-white'
                      : 'text-[var(--color-text-secondary)] hover:text-white',
                  )}
                >
                  {link.label}
                  {/* Underline animation */}
                  <span
                    className={clsx(
                      'absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-300',
                      location.pathname === link.to
                        ? 'w-4/5 bg-gradient-to-r from-[var(--color-accent-blue)] to-[var(--color-accent-violet)]'
                        : 'w-0 group-hover:w-4/5 bg-gradient-to-r from-[var(--color-accent-blue)] to-[var(--color-accent-violet)]',
                    )}
                  />
                </Link>
              ))}

              {/* More dropdown */}
              <div ref={moreRef} className="relative">
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={clsx(
                    'relative px-4 py-2 text-sm font-medium transition-colors duration-200 group inline-flex items-center gap-1',
                    isMoreActive
                      ? 'text-white'
                      : 'text-[var(--color-text-secondary)] hover:text-white',
                  )}
                >
                  {t('marketing.nav.more', 'More')}
                  <ChevronDown
                    size={14}
                    className={clsx(
                      'transition-transform duration-200',
                      moreOpen && 'rotate-180',
                    )}
                  />
                  <span
                    className={clsx(
                      'absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-300',
                      isMoreActive
                        ? 'w-4/5 bg-gradient-to-r from-[var(--color-accent-blue)] to-[var(--color-accent-violet)]'
                        : 'w-0 group-hover:w-4/5 bg-gradient-to-r from-[var(--color-accent-blue)] to-[var(--color-accent-violet)]',
                    )}
                  />
                </button>

                {/* Dropdown panel */}
                <div
                  className={clsx(
                    'absolute top-full right-0 mt-2 w-48 glass-strong rounded-xl p-2 transition-all duration-200',
                    moreOpen
                      ? 'opacity-100 translate-y-0 visible'
                      : 'opacity-0 -translate-y-2 invisible',
                  )}
                >
                  {moreLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={clsx(
                        'block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        location.pathname === link.to
                          ? 'text-white bg-white/[0.06]'
                          : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-white/[0.04]',
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/app"
                className="btn-primary-glow !px-5 !py-2.5 !text-sm !rounded-xl"
              >
                {t('marketing.nav.launchApp', 'Launch App')}
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay menu */}
      <div
        className={clsx(
          'fixed inset-0 z-40 md:hidden transition-all duration-300',
          mobileOpen ? 'visible' : 'invisible',
        )}
      >
        {/* Backdrop */}
        <div
          className={clsx(
            'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setMobileOpen(false)}
        />

        {/* Panel */}
        <div
          className={clsx(
            'absolute top-16 left-0 right-0 glass-strong rounded-b-2xl mx-4 p-6 transition-all duration-300 max-h-[70vh] overflow-y-auto',
            mobileOpen
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-4',
          )}
        >
          <nav className="space-y-1">
            {allMobileLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={clsx(
                  'block px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  location.pathname === link.to
                    ? 'text-white bg-white/[0.06]'
                    : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-white/[0.04]',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <Link
              to="/app"
              className="btn-primary-glow w-full !text-sm !py-3"
            >
              {t('marketing.nav.launchApp', 'Launch App')}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
