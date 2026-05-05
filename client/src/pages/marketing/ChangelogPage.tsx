import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Zap,
  Globe,
  LayoutGrid,
  RefreshCw,
  Palette,
  ImagePlus,
  Hash,
  FileText,
  BarChart3,
  TrendingUp,
  Target,
  Layers,
  Calendar,
  Bot,
  Languages,
  Send,
  Star,
  BookOpen,
  Rocket,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import clsx from 'clsx';

/* ------------------------------------------------------------------ */
/*  Changelog Data                                                      */
/* ------------------------------------------------------------------ */
function useChangelogData() {
  const { t } = useTranslation();

  return [
    {
      date: t('marketing.changelog.v25Date', 'March 2026'),
      version: 'v2.5',
      codename: t('marketing.changelog.v25Name', 'Strategy Suite'),
      tags: [
        { label: t('marketing.changelog.tagNewFeature', 'New Feature'), color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
        { label: t('marketing.changelog.tagAI', 'AI'), color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
        { label: t('marketing.changelog.tagStrategy', 'Strategy'), color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
      ],
      features: [
        { icon: Layers, text: t('marketing.changelog.v25f1', 'Content Pillars & Strategy Planner') },
        { icon: Target, text: t('marketing.changelog.v25f2', 'A/B Testing for post variants') },
        { icon: BarChart3, text: t('marketing.changelog.v25f3', 'Engagement Score Prediction') },
        { icon: TrendingUp, text: t('marketing.changelog.v25f4', 'Trending Topics Discovery') },
        { icon: Zap, text: t('marketing.changelog.v25f5', 'Performance Simulator') },
      ],
    },
    {
      date: t('marketing.changelog.v20Date', 'February 2026'),
      version: 'v2.0',
      codename: t('marketing.changelog.v20Name', 'Creative Powerhouse'),
      tags: [
        { label: t('marketing.changelog.tagMajor', 'Major Release'), color: 'bg-magenta-500/20 text-pink-400 border-pink-500/30' },
        { label: t('marketing.changelog.tagNewFeature', 'New Feature'), color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      ],
      features: [
        { icon: Star, text: t('marketing.changelog.v20f1', 'Viral Post Library (50+ curated examples)') },
        { icon: Sparkles, text: t('marketing.changelog.v20f2', 'Hook Generator (8 hook strategies)') },
        { icon: LayoutGrid, text: t('marketing.changelog.v20f3', 'Carousel & Thread Creator') },
        { icon: FileText, text: t('marketing.changelog.v20f4', 'Template Library (30+ templates)') },
        { icon: RefreshCw, text: t('marketing.changelog.v20f5', 'Content Repurposing Engine') },
        { icon: Hash, text: t('marketing.changelog.v20f6', 'Hashtag Research Tool') },
        { icon: Palette, text: t('marketing.changelog.v20f7', 'Writing Style Cloning') },
        { icon: ImagePlus, text: t('marketing.changelog.v20f8', 'AI Image Generation (DALL-E 3)') },
      ],
    },
    {
      date: t('marketing.changelog.v15Date', 'January 2026'),
      version: 'v1.5',
      codename: t('marketing.changelog.v15Name', 'Multi-Language'),
      tags: [
        { label: t('marketing.changelog.tagI18n', 'i18n'), color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
        { label: t('marketing.changelog.tagEnhancement', 'Enhancement'), color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      ],
      features: [
        { icon: Languages, text: t('marketing.changelog.v15f1', '8 language UI support (FR, EN, ES, DE, PT, AR, ZH, JA)') },
        { icon: Globe, text: t('marketing.changelog.v15f2', 'Multi-language content generation') },
        { icon: BookOpen, text: t('marketing.changelog.v15f3', 'RTL support for Arabic') },
      ],
    },
    {
      date: t('marketing.changelog.v10Date', 'December 2025'),
      version: 'v1.0',
      codename: t('marketing.changelog.v10Name', 'Launch'),
      tags: [
        { label: t('marketing.changelog.tagLaunch', 'Launch'), color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
        { label: t('marketing.changelog.tagCore', 'Core Feature'), color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      ],
      features: [
        { icon: Bot, text: t('marketing.changelog.v10f1', 'Multi-AI generation (OpenAI, Claude, Gemini, Mistral, Ollama)') },
        { icon: Send, text: t('marketing.changelog.v10f2', '6 platform publishing (LinkedIn, X, Facebook, Instagram, TikTok, Pinterest)') },
        { icon: Sparkles, text: t('marketing.changelog.v10f3', 'Streaming generation with real-time display') },
        { icon: FileText, text: t('marketing.changelog.v10f4', 'Post history with search and filters') },
        { icon: Calendar, text: t('marketing.changelog.v10f5', 'Content calendar') },
        { icon: Target, text: t('marketing.changelog.v10f6', 'Platform-specific optimization') },
      ],
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Changelog Page                                                      */
/* ------------------------------------------------------------------ */
export function ChangelogPage() {
  const { t } = useTranslation();
  const entries = useChangelogData();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--color-void)]" />
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute inset-0 grid-pattern" />

        <div className="orb w-72 h-72 top-[15%] right-[10%] bg-[var(--color-accent-violet)]/20" />
        <div className="orb w-56 h-56 top-[50%] left-[5%] bg-[var(--color-accent-blue)]/15" style={{ animationDelay: '5s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-fade-in-up animate-glow-pulse mb-8">
            <Rocket size={14} className="text-[var(--color-accent-violet)]" />
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide uppercase">
              {t('marketing.changelog.heroBadge', 'Changelog')}
            </span>
          </div>

          <h1 className="heading-lg mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-white block">
              {t('marketing.changelog.heroTitle1', "What's")}
            </span>
            <span className="gradient-text-brand block">
              {t('marketing.changelog.heroTitle2', 'New')}
            </span>
          </h1>

          <p
            className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            {t(
              'marketing.changelog.heroSubtitle',
              'See the latest features and improvements we\'ve shipped. We release updates regularly to make PostCommander better for you.',
            )}
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 dot-pattern" />
        <div className="orb w-64 h-64 top-[40%] right-[5%] bg-[var(--color-accent-magenta)]/10" style={{ animationDelay: '3s' }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Timeline line */}
          <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--color-accent-blue)] via-[var(--color-accent-violet)] to-transparent" />

          <div className="space-y-12">
            {entries.map((entry, i) => (
              <div
                key={entry.version}
                className="relative pl-12 sm:pl-20 animate-fade-in-up"
                style={{ animationDelay: `${0.1 + i * 0.15}s` }}
              >
                {/* Timeline dot */}
                <div className="absolute left-2 sm:left-6 top-2 w-4 h-4 rounded-full bg-gradient-to-br from-[var(--color-accent-blue)] to-[var(--color-accent-violet)] ring-4 ring-[var(--color-void)]" />

                {/* Date and version badges */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-sm font-semibold text-white font-display">
                    {entry.date}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[var(--color-accent-blue)]/20 to-[var(--color-accent-violet)]/20 border border-[var(--color-accent-violet)]/30 text-xs font-bold text-[var(--color-accent-violet)]">
                    {entry.version}
                  </span>
                </div>

                {/* Card */}
                <div className="glass-card p-6 sm:p-8 rounded-2xl">
                  <h3 className="heading-md text-white mb-4">
                    {entry.codename}
                  </h3>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {entry.tags.map((tag, j) => (
                      <span
                        key={j}
                        className={clsx(
                          'inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold border',
                          tag.color,
                        )}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {entry.features.map((feature, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <feature.icon size={16} className="text-[var(--color-accent-blue)] shrink-0 mt-0.5" />
                        <span className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--color-surface)]" />
        <div className="absolute inset-0 mesh-gradient opacity-30" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-lg text-white mb-6 animate-fade-in-up">
            {t('marketing.changelog.ctaTitle', 'Try the Latest Features')}
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {t(
              'marketing.changelog.ctaSubtitle',
              'All new features are available immediately. Start using PostCommander today and experience the difference.',
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/app" className="btn-primary-glow">
              {t('marketing.changelog.ctaPrimary', 'Launch App')}
              <ArrowRight size={18} />
            </Link>
            <Link to="/features" className="btn-ghost-glow">
              {t('marketing.changelog.ctaSecondary', 'View All Features')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
