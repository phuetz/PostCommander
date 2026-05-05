import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Check,
  X as XIcon,
  Minus,
  Award,
  Zap,
  Globe,
  Bot,
  Target,
  Crown,
  TrendingUp,
} from 'lucide-react';
import clsx from 'clsx';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
type CellValue = true | false | string;

interface FeatureRow {
  feature: string;
  values: CellValue[];
}

interface FeatureGroup {
  category: string;
  rows: FeatureRow[];
}

/* ------------------------------------------------------------------ */
/*  Data                                                                */
/* ------------------------------------------------------------------ */
const COMPETITORS = ['PostCommander', 'Taplio', 'Buffer', 'Hootsuite', 'Copy.ai'] as const;

function useFeatureData() {
  const { t } = useTranslation();

  const featureGroups: FeatureGroup[] = [
    {
      category: t('marketing.compare.catGeneration', 'Content Generation'),
      rows: [
        {
          feature: t('marketing.compare.featureAiGen', 'AI-powered post generation'),
          values: [true, true, 'Limited', true, true],
        },
        {
          feature: t('marketing.compare.featureMultiAi', 'Multi-AI model support'),
          values: ['5 models', '1 model', false, false, '2 models'],
        },
        {
          feature: t('marketing.compare.featureStreaming', 'Streaming generation'),
          values: [true, false, false, false, true],
        },
        {
          feature: t('marketing.compare.featureTone', 'Tone / style presets'),
          values: ['8 presets', '3 presets', false, false, '5 presets'],
        },
        {
          feature: t('marketing.compare.featureStyleClone', 'Writing style cloning'),
          values: [true, 'Limited', false, false, false],
        },
      ],
    },
    {
      category: t('marketing.compare.catPlatforms', 'Platforms'),
      rows: [
        {
          feature: 'LinkedIn',
          values: [true, true, true, true, true],
        },
        {
          feature: 'X / Twitter',
          values: [true, true, true, true, true],
        },
        {
          feature: 'Instagram',
          values: [true, false, true, true, 'Limited'],
        },
        {
          feature: 'Facebook',
          values: [true, false, true, true, false],
        },
        {
          feature: 'TikTok',
          values: [true, false, false, true, false],
        },
        {
          feature: 'Pinterest',
          values: [true, false, true, true, false],
        },
      ],
    },
    {
      category: t('marketing.compare.catAdvanced', 'Advanced Tools'),
      rows: [
        {
          feature: t('marketing.compare.featureViralLib', 'Viral post library'),
          values: [true, true, false, false, false],
        },
        {
          feature: t('marketing.compare.featureHookGen', 'Hook generator'),
          values: [true, false, false, false, 'Limited'],
        },
        {
          feature: t('marketing.compare.featureCarousel', 'Carousel / thread creator'),
          values: [true, 'Limited', false, false, false],
        },
        {
          feature: t('marketing.compare.featureABTest', 'A/B testing'),
          values: [true, false, false, 'Limited', false],
        },
        {
          feature: t('marketing.compare.featureEngagement', 'Engagement prediction'),
          values: [true, false, false, false, false],
        },
        {
          feature: t('marketing.compare.featureTrending', 'Trending topics'),
          values: [true, 'Limited', false, false, false],
        },
        {
          feature: t('marketing.compare.featurePillars', 'Content pillars'),
          values: [true, false, false, false, false],
        },
        {
          feature: t('marketing.compare.featureAiImages', 'AI image generation'),
          values: [true, false, false, false, false],
        },
        {
          feature: t('marketing.compare.featureHashtag', 'Hashtag research'),
          values: [true, 'Limited', 'Limited', true, false],
        },
        {
          feature: t('marketing.compare.featureTemplates', 'Template library'),
          values: [true, 'Limited', false, 'Limited', 'Limited'],
        },
      ],
    },
    {
      category: t('marketing.compare.catLanguages', 'Languages'),
      rows: [
        {
          feature: t('marketing.compare.featureMultiLangUI', 'Multi-language UI'),
          values: ['8 languages', '2 languages', '3 languages', '3 languages', '1 language'],
        },
        {
          feature: t('marketing.compare.featureMultiLangContent', 'Multi-language content'),
          values: [true, 'Limited', false, false, true],
        },
      ],
    },
    {
      category: t('marketing.compare.catPricing', 'Pricing'),
      rows: [
        {
          feature: t('marketing.compare.featureFreePlan', 'Free plan'),
          values: [true, false, true, false, true],
        },
        {
          feature: t('marketing.compare.featureStartPrice', 'Starting price'),
          values: ['\u20ac19/mo', '$49/mo', '$6/mo', '$99/mo', '$49/mo'],
        },
        {
          feature: t('marketing.compare.featureAnnual', 'Annual discount'),
          values: ['20%', '20%', '—', '—', '25%'],
        },
      ],
    },
  ];

  return featureGroups;
}

/* ------------------------------------------------------------------ */
/*  Cell Renderer                                                       */
/* ------------------------------------------------------------------ */
function CellContent({ value, isPostCommander }: { value: CellValue; isPostCommander: boolean }) {
  if (value === true) {
    return (
      <span
        className={clsx(
          'inline-flex items-center justify-center w-6 h-6 rounded-full',
          isPostCommander
            ? 'bg-[var(--color-accent-emerald)]/20 text-[var(--color-accent-emerald)] glow-border'
            : 'bg-[var(--color-accent-emerald)]/10 text-[var(--color-accent-emerald)]',
        )}
        style={
          isPostCommander
            ? { boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)' }
            : {}
        }
      >
        <Check size={14} strokeWidth={3} />
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/[0.04] text-[var(--color-text-muted)] opacity-40">
        <XIcon size={14} strokeWidth={2} />
      </span>
    );
  }

  if (value === 'Limited') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-semibold">
        <Minus size={10} />
        {value}
      </span>
    );
  }

  // String value (specific info)
  return (
    <span
      className={clsx(
        'text-[11px] font-medium',
        isPostCommander
          ? 'text-[var(--color-accent-emerald)]'
          : 'text-[var(--color-text-secondary)]',
      )}
    >
      {value}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero Section                                                        */
/* ------------------------------------------------------------------ */
function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative pt-28 lg:pt-36 pb-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 dot-pattern" />
      <div className="orb w-96 h-96 top-[20%] right-[10%] bg-[var(--color-accent-violet)]/10" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Trust badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-fade-in-up animate-glow-pulse mb-8">
          <Award size={14} className="text-[var(--color-accent-violet)]" />
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide">
            {t('marketing.compare.badge', 'Rated #1 for multi-platform content creation')}
          </span>
        </div>

        {/* Heading */}
        <h1 className="heading-lg mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <span className="text-white block">
            {t('marketing.compare.titleLine1', 'How PostCommander')}
          </span>
          <span className="gradient-text-brand animate-shimmer block" style={{ backgroundSize: '200% auto' }}>
            {t('marketing.compare.titleLine2', 'Compares')}
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          {t(
            'marketing.compare.subtitle',
            'See why 2,500+ creators chose PostCommander over alternatives',
          )}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick Comparison Cards                                              */
/* ------------------------------------------------------------------ */
function QuickComparisonCards() {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const cards = [
    {
      name: 'PostCommander',
      price: t('marketing.compare.quickPricePC', 'From \u20ac19/mo'),
      platforms: '6',
      aiModels: '5',
      languages: '8',
      highlighted: true,
    },
    {
      name: 'Taplio',
      price: t('marketing.compare.quickPriceTaplio', 'From $49/mo'),
      platforms: '2',
      aiModels: '1',
      languages: '2',
      highlighted: false,
    },
    {
      name: 'Buffer',
      price: t('marketing.compare.quickPriceBuffer', 'From $6/mo'),
      platforms: '6',
      aiModels: '0',
      languages: '3',
      highlighted: false,
    },
    {
      name: 'Hootsuite',
      price: t('marketing.compare.quickPriceHootsuite', 'From $99/mo'),
      platforms: '5',
      aiModels: '1',
      languages: '3',
      highlighted: false,
    },
    {
      name: 'Copy.ai',
      price: t('marketing.compare.quickPriceCopyai', 'From $49/mo'),
      platforms: '3',
      aiModels: '2',
      languages: '1',
      highlighted: false,
    },
  ];

  return (
    <section className="relative py-16 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory"
        >
          {cards.map((card, i) => (
            <div
              key={card.name}
              className={clsx(
                'flex-shrink-0 snap-center rounded-2xl p-6 transition-all animate-fade-in-up',
                card.highlighted
                  ? 'w-64 sm:w-72 gradient-border glass-strong glow-violet'
                  : 'w-56 sm:w-60 glass-card',
                i === 0 && 'delay-100',
                i === 1 && 'delay-200',
                i === 2 && 'delay-300',
                i === 3 && 'delay-400',
                i === 4 && 'delay-500',
              )}
            >
              {card.highlighted && (
                <div className="flex items-center gap-1.5 mb-3">
                  <Crown size={14} className="text-[var(--color-accent-violet)]" />
                  <span className="text-[10px] font-bold text-[var(--color-accent-violet)] uppercase tracking-wider">
                    {t('marketing.compare.ourPick', 'Our Pick')}
                  </span>
                </div>
              )}

              <h3
                className={clsx(
                  'font-display font-bold mb-1',
                  card.highlighted ? 'text-xl text-white' : 'text-lg text-white',
                )}
              >
                {card.name}
              </h3>
              <div className="text-sm text-[var(--color-text-secondary)] mb-5">{card.price}</div>

              <div className="space-y-3">
                {[
                  {
                    label: t('marketing.compare.quickPlatforms', 'Platforms'),
                    value: card.platforms,
                  },
                  {
                    label: t('marketing.compare.quickAiModels', 'AI Models'),
                    value: card.aiModels,
                  },
                  {
                    label: t('marketing.compare.quickLanguages', 'Languages'),
                    value: card.languages,
                  },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--color-text-muted)]">{stat.label}</span>
                    <span
                      className={clsx(
                        'text-sm font-bold',
                        card.highlighted
                          ? 'text-[var(--color-accent-emerald)]'
                          : 'text-[var(--color-text-secondary)]',
                      )}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature Comparison Table                                            */
/* ------------------------------------------------------------------ */
function FeatureComparisonTable() {
  const { t } = useTranslation();
  const featureGroups = useFeatureData();

  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('marketing.compare.tableHeading', 'Feature-by-Feature Comparison')}
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto animate-fade-in-up delay-100">
            {t(
              'marketing.compare.tableSubtitle',
              'A transparent look at how every tool stacks up across the features that matter most.',
            )}
          </p>
        </div>

        {/* Table wrapper */}
        <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up delay-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              {/* Header */}
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="sticky left-0 z-10 bg-[var(--color-surface)] text-left px-5 py-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider w-[200px]">
                    {t('marketing.compare.tableFeature', 'Feature')}
                  </th>
                  {COMPETITORS.map((name, i) => (
                    <th
                      key={name}
                      className={clsx(
                        'px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider min-w-[110px]',
                        i === 0
                          ? 'bg-[var(--color-accent-violet)]/[0.06] text-[var(--color-accent-violet)]'
                          : 'text-[var(--color-text-muted)]',
                      )}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {i === 0 && (
                          <Crown size={12} className="text-[var(--color-accent-violet)]" />
                        )}
                        {name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {featureGroups.map((group) => (
                  <>
                    {/* Category header */}
                    <tr key={`cat-${group.category}`} className="border-b border-white/[0.04]">
                      <td
                        colSpan={6}
                        className="sticky left-0 z-10 bg-white/[0.02] px-5 py-3 text-[11px] font-bold text-[var(--color-accent-blue)] uppercase tracking-wider"
                      >
                        {group.category}
                      </td>
                    </tr>

                    {group.rows.map((row, rowIdx) => (
                      <tr
                        key={`${group.category}-${rowIdx}`}
                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="sticky left-0 z-10 bg-[var(--color-surface)] px-5 py-3 text-sm text-[var(--color-text-secondary)]">
                          {row.feature}
                        </td>
                        {row.values.map((val, colIdx) => (
                          <td
                            key={colIdx}
                            className={clsx(
                              'px-4 py-3 text-center',
                              colIdx === 0 && 'bg-[var(--color-accent-violet)]/[0.03]',
                            )}
                          >
                            <CellContent value={val} isPostCommander={colIdx === 0} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Key Differentiators                                                 */
/* ------------------------------------------------------------------ */
function KeyDifferentiators() {
  const { t } = useTranslation();

  const differentiators = [
    {
      icon: Bot,
      title: t('marketing.compare.diff1Title', '5 AI Models in One Place'),
      description: t(
        'marketing.compare.diff1Desc',
        'Compare outputs from GPT-4o, Claude, Gemini, Mistral, and Ollama side by side. Switch between models in one click to find the perfect voice for every post. No other tool offers this level of AI flexibility.',
      ),
      color: 'var(--color-accent-violet)',
    },
    {
      icon: Globe,
      title: t('marketing.compare.diff2Title', 'True Multi-Platform Native'),
      description: t(
        'marketing.compare.diff2Desc',
        'Not just cross-posting. Each platform gets genuinely optimized content that respects character limits, hashtag conventions, media formats, and audience expectations. LinkedIn gets thought leadership, X gets punchy threads, Instagram gets visual captions.',
      ),
      color: 'var(--color-accent-blue)',
    },
    {
      icon: Target,
      title: t('marketing.compare.diff3Title', 'Complete Strategy Suite'),
      description: t(
        'marketing.compare.diff3Desc',
        'From trending topics to content pillars to A/B testing to engagement prediction. PostCommander is a full content strategy engine, not just a post generator. Plan your content calendar, analyze performance, and optimize your strategy \u2014 all from one dashboard.',
      ),
      color: 'var(--color-accent-emerald)',
    },
  ];

  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('marketing.compare.diffHeading', 'What Sets Us Apart')}
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {differentiators.map((d, i) => (
            <div
              key={d.title}
              className={clsx(
                'glass-card rounded-2xl p-8 hover:bg-white/[0.05] transition-all group animate-fade-in-up',
                i === 0 && 'delay-100',
                i === 1 && 'delay-200',
                i === 2 && 'delay-300',
              )}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: `color-mix(in srgb, ${d.color} 12%, transparent)` }}
              >
                <d.icon size={24} style={{ color: d.color }} />
              </div>
              <h3 className="heading-sm text-white mb-3">{d.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {d.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Pricing Comparison                                                  */
/* ------------------------------------------------------------------ */
function PricingComparison() {
  const { t } = useTranslation();

  const competitors = [
    { name: 'Taplio', price: 49, currency: '$' },
    { name: 'Buffer', price: 6, currency: '$', note: t('marketing.compare.pricingBufferNote', 'Limited AI') },
    { name: 'Hootsuite', price: 99, currency: '$' },
    { name: 'Copy.ai', price: 49, currency: '$' },
  ];

  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('marketing.compare.pricingHeading', 'Better Value at Every Level')}
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto animate-fade-in-up delay-100">
            {t(
              'marketing.compare.pricingSubtitle',
              'Get more features for less. PostCommander Pro delivers premium capabilities at a fraction of the cost.',
            )}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 animate-fade-in-up delay-200">
          {/* PostCommander card */}
          <div className="gradient-border glass-strong rounded-2xl p-8 relative">
            <div className="flex items-center gap-2 mb-2">
              <Crown size={16} className="text-[var(--color-accent-violet)]" />
              <span className="text-[10px] font-bold text-[var(--color-accent-violet)] uppercase tracking-wider">
                {t('marketing.compare.pricingBestValue', 'Best Value')}
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-1">PostCommander Pro</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-display text-4xl font-extrabold text-white">&euro;19</span>
              <span className="text-sm text-[var(--color-text-muted)]">/mo</span>
            </div>

            <ul className="space-y-3">
              {[
                t('marketing.compare.pricingFeature1', '5 AI models included'),
                t('marketing.compare.pricingFeature2', '6 platforms supported'),
                t('marketing.compare.pricingFeature3', 'Unlimited posts'),
                t('marketing.compare.pricingFeature4', 'All advanced tools'),
                t('marketing.compare.pricingFeature5', '8 languages'),
                t('marketing.compare.pricingFeature6', '20% annual discount'),
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-accent-emerald)]/20 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-[var(--color-accent-emerald)]" />
                  </span>
                  <span className="text-sm text-[var(--color-text-secondary)]">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Competitors card */}
          <div className="glass-card rounded-2xl p-8">
            <h3 className="font-display text-lg font-bold text-[var(--color-text-secondary)] mb-6">
              {t('marketing.compare.pricingAlternatives', 'Alternatives')}
            </h3>

            <div className="space-y-4">
              {competitors.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{c.name}</div>
                    {c.note && (
                      <div className="text-[10px] text-amber-400">{c.note}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[var(--color-text-secondary)]">
                      {c.currency}{c.price}
                      <span className="text-xs text-[var(--color-text-muted)]">/mo</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-[var(--color-accent-emerald)]/[0.06] border border-[var(--color-accent-emerald)]/20">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--color-accent-emerald)]" />
                <span className="text-sm font-semibold text-[var(--color-accent-emerald)]">
                  {t('marketing.compare.pricingSave', 'Save up to 70% vs leading alternatives')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Migration CTA                                                       */
/* ------------------------------------------------------------------ */
function MigrationCTA() {
  const { t } = useTranslation();

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 mesh-gradient opacity-40" />
      <div className="orb w-72 h-72 top-[20%] left-[10%] bg-[var(--color-accent-blue)]/12" />
      <div
        className="orb w-56 h-56 bottom-[20%] right-[15%] bg-[var(--color-accent-violet)]/10"
        style={{ animationDelay: '6s' }}
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="glass-card rounded-2xl p-10 sm:p-14 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-violet)]/10 flex items-center justify-center mx-auto mb-6">
            <Zap size={28} className="text-[var(--color-accent-violet)]" />
          </div>

          <h2 className="heading-md text-white mb-4">
            {t('marketing.compare.ctaHeading', 'Ready to Switch?')}
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-8 max-w-lg mx-auto leading-relaxed">
            {t(
              'marketing.compare.ctaDescription',
              'Import your content and get started in minutes. Our migration assistant helps you bring over your templates, drafts, and publishing schedule seamlessly.',
            )}
          </p>

          <Link to="/app" className="btn-primary-glow text-lg">
            {t('marketing.compare.ctaButton', 'Start Free Trial')}
            <ArrowRight size={20} />
          </Link>

          <p className="text-sm text-[var(--color-text-muted)] mt-4">
            {t('marketing.compare.ctaFine', 'No credit card required. Cancel anytime.')}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Export                                                              */
/* ------------------------------------------------------------------ */
export function ComparePage() {
  return (
    <>
      <HeroSection />
      <QuickComparisonCards />
      <FeatureComparisonTable />
      <KeyDifferentiators />
      <PricingComparison />
      <MigrationCTA />
    </>
  );
}
