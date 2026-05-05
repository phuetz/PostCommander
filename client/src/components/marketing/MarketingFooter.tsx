import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Twitter, Linkedin, Github, Send } from 'lucide-react';
import { useState } from 'react';

export function MarketingFooter() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const footerSections = [
    {
      title: t('marketing.footer.product', 'Product'),
      links: [
        { label: t('marketing.footer.features', 'Features'), to: '/features' },
        { label: t('marketing.footer.pricing', 'Pricing'), to: '/pricing' },
        { label: t('marketing.footer.demo', 'Demo'), to: '/demo' },
        { label: t('marketing.footer.integrations', 'Integrations'), to: '/integrations' },
        { label: t('marketing.footer.compare', 'Compare'), to: '/compare' },
        { label: t('marketing.footer.changelog', 'Changelog'), to: '/changelog' },
      ],
    },
    {
      title: t('marketing.footer.solutions', 'Solutions'),
      links: [
        { label: t('marketing.footer.useCases', 'Use Cases'), to: '/use-cases' },
        { label: t('marketing.footer.enterprise', 'Enterprise'), to: '/enterprise' },
        { label: t('marketing.footer.partners', 'Partners'), to: '/partners' },
        { label: t('marketing.footer.testimonials', 'Testimonials'), to: '/testimonials' },
      ],
    },
    {
      title: t('marketing.footer.company', 'Company'),
      links: [
        { label: t('marketing.footer.about', 'About'), to: '/about' },
        { label: t('marketing.footer.blog', 'Blog'), to: '/blog' },
        { label: t('marketing.footer.contact', 'Contact'), to: '/contact' },
        { label: t('marketing.footer.careers', 'Careers'), to: '#' },
      ],
    },
    {
      title: t('marketing.footer.resources', 'Resources'),
      links: [
        { label: t('marketing.footer.faq', 'FAQ'), to: '/faq' },
        { label: t('marketing.footer.terms', 'Terms'), to: '/terms' },
        { label: t('marketing.footer.privacy', 'Privacy'), to: '/privacy' },
        { label: t('marketing.footer.docs', 'API Docs'), to: '#' },
      ],
    },
  ];

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter / X' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Github, href: '#', label: 'GitHub' },
  ];

  return (
    <footer className="relative bg-[var(--color-surface)] dot-pattern">
      {/* Gradient top border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--color-accent-blue), var(--color-accent-violet), var(--color-accent-magenta), transparent)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer grid */}
        <div className="py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Brand + Newsletter column */}
          <div className="lg:col-span-5">
            <Link to="/" className="inline-flex items-center gap-1 mb-4">
              <span className="font-display text-xl font-extrabold text-white tracking-tight">
                Post
              </span>
              <span className="font-display text-xl font-extrabold gradient-text-brand tracking-tight">
                Commander
              </span>
            </Link>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-sm mb-8">
              {t(
                'marketing.footer.description',
                'AI-powered social media content creation for modern creators. Generate, optimize, and publish to 6 platforms with 5 AI models.',
              )}
            </p>

            {/* Newsletter */}
            <div>
              <h4 className="font-display text-sm font-bold text-white mb-3">
                {t('marketing.footer.newsletterTitle', 'Stay ahead of the curve')}
              </h4>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('marketing.footer.emailPlaceholder', 'Enter your email')}
                    className="w-full px-4 py-2.5 rounded-xl glass text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-violet)]/50 transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary-glow !px-4 !py-2.5 !rounded-xl !text-sm"
                >
                  {subscribed ? (
                    t('marketing.footer.subscribed', 'Done!')
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h4 className="font-display text-xs font-bold text-white uppercase tracking-widest mb-4">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--color-text-muted)]">
            &copy; {new Date().getFullYear()} PostCommander. {t('marketing.footer.rights', 'All rights reserved.')}
          </p>

          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-white/[0.04] transition-all duration-200"
                aria-label={social.label}
                target="_blank"
                rel="noopener noreferrer"
              >
                <social.icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
