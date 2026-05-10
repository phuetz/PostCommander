import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Star,
  Quote,
  Users,
  FileText,
  Globe,
  Award,
  TrendingUp,
  BarChart3,
  Heart,
  MessageSquare,
  Eye,
  Zap,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

/* ------------------------------------------------------------------ */
/*  Star Rating Component                                              */
/* ------------------------------------------------------------------ */
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={clsx(
            i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--color-text-muted)]',
          )}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero Section                                                       */
/* ------------------------------------------------------------------ */
function TestimonialsHero() {
  const { t } = useTranslation();

  const heroStats = [
    { value: '2,500+', label: t('marketing.testimonials.statCreators', 'Creators') },
    { value: '4.9/5', label: t('marketing.testimonials.statRating', 'Rating') },
    { value: '10M+', label: t('marketing.testimonials.statPosts', 'Posts Generated') },
  ];

  return (
    <section className="relative min-h-[80vh] flex items-center pt-24 lg:pt-0 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 grid-pattern" />

      <div className="orb w-72 h-72 top-[10%] left-[5%] bg-[var(--color-accent-violet)]/20" />
      <div
        className="orb w-96 h-96 top-[60%] right-[5%] bg-[var(--color-accent-magenta)]/15"
        style={{ animationDelay: '5s' }}
      />
      <div
        className="orb w-56 h-56 top-[30%] right-[30%] bg-[var(--color-accent-blue)]/10"
        style={{ animationDelay: '10s' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-fade-in-up animate-glow-pulse mb-8">
          <Heart size={14} className="text-[var(--color-accent-magenta)]" />
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide uppercase">
            {t('marketing.testimonials.badge', 'Social Proof')}
          </span>
        </div>

        <h1
          className="heading-lg text-white mb-6 animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          {t('marketing.testimonials.heroTitle', 'Creators')}{' '}
          <span className="gradient-text-brand">
            {t('marketing.testimonials.heroTitleHighlight', 'Love')}
          </span>{' '}
          {t('marketing.testimonials.heroTitleEnd', 'PostCommander')}
        </h1>

        <p
          className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          {t(
            'marketing.testimonials.heroSubtitle',
            'See how thousands of creators transformed their social media presence',
          )}
        </p>

        <div
          className="flex flex-wrap justify-center gap-4 sm:gap-6 animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          {heroStats.map((stat) => (
            <div key={stat.label} className="glass-card px-6 py-4 min-w-[130px]">
              <div className="heading-md gradient-text-brand">{stat.value}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Featured Testimonial                                               */
/* ------------------------------------------------------------------ */
function FeaturedTestimonial() {
  const { t } = useTranslation();

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute inset-0 dot-pattern" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="gradient-border animate-fade-in-up">
          <div className="glass-card p-8 sm:p-12 lg:p-16 relative overflow-hidden">
            {/* Decorative quote mark */}
            <div className="absolute top-6 left-6 sm:top-8 sm:left-8">
              <Quote size={48} className="text-[var(--color-accent-violet)]/20" />
            </div>

            {/* Large decorative quote in background */}
            <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none">
              <span className="font-display text-[20rem] font-black leading-none">&ldquo;</span>
            </div>

            <div className="relative">
              <blockquote
                className="font-display text-xl sm:text-2xl lg:text-3xl font-medium leading-relaxed mb-8"
                style={{ fontStyle: 'italic' }}
              >
                <span className="gradient-text-cool">
                  {t(
                    'marketing.testimonials.featured.quote',
                    "PostCommander didn't just save me time \u2014 it transformed my entire content strategy. I went from posting once a week to dominating all 6 platforms with consistent, high-quality content.",
                  )}
                </span>
              </blockquote>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[var(--color-accent-violet)] to-[var(--color-accent-magenta)]">
                  <span className="font-display font-bold text-white text-lg">SC</span>
                </div>
                <div>
                  <div className="font-display font-bold text-white text-lg">
                    {t('marketing.testimonials.featured.name', 'Sarah Chen')}
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    {t('marketing.testimonials.featured.role', 'Founder & CEO of GrowthLab')}
                  </div>
                </div>
                <div className="sm:ml-auto">
                  <StarRating rating={5} size={18} />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    value: '300%',
                    label: t('marketing.testimonials.featured.stat1', 'Engagement increase'),
                  },
                  {
                    value: '15 hrs',
                    label: t('marketing.testimonials.featured.stat2', 'Saved per week'),
                  },
                  {
                    value: '50K',
                    label: t('marketing.testimonials.featured.stat3', 'New followers in 6 months'),
                  },
                ].map((stat) => (
                  <div key={stat.label} className="glass px-4 py-3 rounded-xl text-center">
                    <div className="font-display font-bold text-white text-lg">{stat.value}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonial Card                                                   */
/* ------------------------------------------------------------------ */
interface TestimonialData {
  name: string;
  role: string;
  initials: string;
  quote: string;
  stats: { value: string; label: string }[];
  platforms: string[];
  rating: number;
  accent: string;
  avatarGradient: string;
}

function TestimonialCard({ testimonial, index }: { testimonial: TestimonialData; index: number }) {
  const { t } = useTranslation();

  return (
    <div
      className="glass-card p-6 sm:p-8 group transition-all duration-300 hover:-translate-y-1 animate-fade-in-up relative overflow-hidden"
      style={{
        borderLeft: `3px solid ${testimonial.accent}`,
        animationDelay: `${index * 0.12}s`,
      }}
    >
      {/* Decorative quote marks */}
      <div className="absolute -top-2 -right-2 opacity-[0.04] pointer-events-none">
        <span className="font-display text-[8rem] font-black leading-none">&ldquo;</span>
      </div>

      {/* Quote */}
      <blockquote
        className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed mb-6"
        style={{ fontStyle: 'italic' }}
      >
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: testimonial.avatarGradient }}
        >
          <span className="font-display font-bold text-white text-sm">{testimonial.initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-white text-sm truncate">
            {testimonial.name}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] truncate">{testimonial.role}</div>
        </div>
        <StarRating rating={testimonial.rating} size={12} />
      </div>

      {/* Stats badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {testimonial.stats.map((stat) => (
          <div key={stat.label} className="glass px-2.5 py-1 rounded-lg">
            <span className="text-[11px] font-semibold text-white">{stat.value}</span>
            <span className="text-[10px] text-[var(--color-text-muted)] ml-1">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Platform tags */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {testimonial.platforms.map((p) => (
            <span
              key={p}
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
              style={{ background: `${testimonial.accent}15`, color: testimonial.accent }}
            >
              {p}
            </span>
          ))}
        </div>
        <Link
          to="#"
          className="text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-white transition-colors flex items-center gap-1 flex-shrink-0"
        >
          {t('marketing.testimonials.readMore', 'Read Full Story')}
          <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Success Stories Grid                                               */
/* ------------------------------------------------------------------ */
function SuccessStoriesGrid() {
  const { t } = useTranslation();

  const testimonials: TestimonialData[] = [
    {
      name: t('marketing.testimonials.t1.name', 'Marc Dubois'),
      role: t('marketing.testimonials.t1.role', 'Social Media Manager at TechStart'),
      initials: 'MD',
      quote: t(
        'marketing.testimonials.t1.quote',
        "Managing 6 social accounts for 3 clients used to take my entire day. Now I generate a week's content in an hour. The style cloning feature matches each client's voice perfectly.",
      ),
      stats: [
        { value: '6x', label: t('marketing.testimonials.t1.s1', 'content output') },
        { value: '3', label: t('marketing.testimonials.t1.s2', 'client accounts') },
        { value: '+40%', label: t('marketing.testimonials.t1.s3', 'engagement') },
      ],
      platforms: ['LinkedIn', 'Instagram'],
      rating: 5,
      accent: 'var(--color-accent-blue)',
      avatarGradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    },
    {
      name: t('marketing.testimonials.t2.name', 'Yuki Tanaka'),
      role: t('marketing.testimonials.t2.role', 'Freelance Coach, Tokyo'),
      initials: 'YT',
      quote: t(
        'marketing.testimonials.t2.quote',
        'As a non-native English speaker, I always struggled with LinkedIn posts. PostCommander generates professional content in both Japanese and English. The multilingual support is incredible.',
      ),
      stats: [
        { value: '2', label: t('marketing.testimonials.t2.s1', 'languages') },
        { value: '10K', label: t('marketing.testimonials.t2.s2', 'LinkedIn followers') },
        { value: '8 hrs', label: t('marketing.testimonials.t2.s3', 'saved/week') },
      ],
      platforms: ['LinkedIn', 'Twitter'],
      rating: 5,
      accent: 'var(--color-accent-violet)',
      avatarGradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
    },
    {
      name: t('marketing.testimonials.t3.name', 'Elena Rodriguez'),
      role: t('marketing.testimonials.t3.role', 'E-commerce Founder'),
      initials: 'ER',
      quote: t(
        'marketing.testimonials.t3.quote',
        'The carousel creator and Instagram optimization changed my game. My product posts went from 50 likes to 500+ consistently. The hashtag research alone is worth the subscription.',
      ),
      stats: [
        { value: '900%', label: t('marketing.testimonials.t3.s1', 'more likes') },
        { value: '2x', label: t('marketing.testimonials.t3.s2', 'sales from social') },
        { value: '30', label: t('marketing.testimonials.t3.s3', 'hashtags/post') },
      ],
      platforms: ['Instagram', 'Pinterest', 'TikTok'],
      rating: 5,
      accent: 'var(--color-accent-magenta)',
      avatarGradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    },
    {
      name: t('marketing.testimonials.t4.name', 'James Wilson'),
      role: t('marketing.testimonials.t4.role', 'Recruiter at BigCorp'),
      initials: 'JW',
      quote: t(
        'marketing.testimonials.t4.quote',
        "Our employer branding posts went viral on LinkedIn. PostCommander's recruiting templates and professional tone generate job posts that actually attract top talent.",
      ),
      stats: [
        { value: '200%', label: t('marketing.testimonials.t4.s1', 'more applications') },
        { value: '5', label: t('marketing.testimonials.t4.s2', 'platforms') },
        { value: '+45%', label: t('marketing.testimonials.t4.s3', 'employer brand') },
      ],
      platforms: ['LinkedIn', 'Facebook'],
      rating: 5,
      accent: 'var(--color-accent-cyan)',
      avatarGradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    },
    {
      name: t('marketing.testimonials.t5.name', 'Fatima Al-Hassan'),
      role: t('marketing.testimonials.t5.role', 'Marketing Agency Owner'),
      initials: 'FA',
      quote: t(
        'marketing.testimonials.t5.quote',
        'We switched from Taplio and Buffer combined to just PostCommander. The multi-AI feature lets us find the perfect voice for each client. And the A/B testing? Game changer.',
      ),
      stats: [
        { value: '2 tools', label: t('marketing.testimonials.t5.s1', 'replaced') },
        { value: '8', label: t('marketing.testimonials.t5.s2', 'clients managed') },
        { value: '\u20AC300/mo', label: t('marketing.testimonials.t5.s3', 'saved') },
      ],
      platforms: ['All Platforms'],
      rating: 5,
      accent: 'var(--color-accent-emerald)',
      avatarGradient: 'linear-gradient(135deg, #10b981, #34d399)',
    },
    {
      name: t('marketing.testimonials.t6.name', 'Thomas M\u00fcller'),
      role: t('marketing.testimonials.t6.role', 'SaaS Build-in-Public Creator'),
      initials: 'TM',
      quote: t(
        'marketing.testimonials.t6.quote',
        'Building in public means posting daily updates across Twitter, LinkedIn, and Instagram. PostCommander turns my changelog into engaging stories for each platform. The repurposing feature is magic.',
      ),
      stats: [
        { value: 'Daily', label: t('marketing.testimonials.t6.s1', '3 platforms') },
        { value: '25K', label: t('marketing.testimonials.t6.s2', 'total followers') },
        { value: '#1', label: t('marketing.testimonials.t6.s3', 'Product Hunt') },
      ],
      platforms: ['Twitter', 'LinkedIn', 'Instagram'],
      rating: 5,
      accent: 'var(--color-accent-blue)',
      avatarGradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 grid-pattern" />
      <div
        className="orb w-72 h-72 top-[15%] left-[5%] bg-[var(--color-accent-blue)]/10"
        style={{ animationDelay: '3s' }}
      />
      <div
        className="orb w-64 h-64 bottom-[10%] right-[10%] bg-[var(--color-accent-violet)]/10"
        style={{ animationDelay: '8s' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-glow-pulse mb-6">
            <Award size={14} className="text-[var(--color-accent-violet)]" />
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide uppercase">
              {t('marketing.testimonials.storiesBadge', 'Success Stories')}
            </span>
          </div>
          <h2 className="heading-md text-white mb-4">
            {t('marketing.testimonials.storiesTitle', 'Real Results from')}{' '}
            <span className="gradient-text-brand">
              {t('marketing.testimonials.storiesTitleHighlight', 'Real Creators')}
            </span>
          </h2>
        </div>

        {/* Masonry-style 2-column layout */}
        <div className="columns-1 md:columns-2 gap-6 space-y-6">
          {testimonials.map((testimonial, index) => (
            <div key={testimonial.name} className="break-inside-avoid">
              <TestimonialCard testimonial={testimonial} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats Section                                                      */
/* ------------------------------------------------------------------ */
function StatsSection() {
  const { t } = useTranslation();

  const stats = [
    {
      value: '2,500+',
      numValue: 2500,
      label: t('marketing.testimonials.metricCreators', 'Creators'),
      icon: <Users size={22} />,
    },
    {
      value: '10M+',
      numValue: 10,
      label: t('marketing.testimonials.metricPosts', 'Posts Generated'),
      icon: <FileText size={22} />,
      suffix: 'M+',
    },
    {
      value: '6',
      numValue: 6,
      label: t('marketing.testimonials.metricPlatforms', 'Platforms'),
      icon: <Globe size={22} />,
    },
    {
      value: '4.9/5',
      numValue: 49,
      label: t('marketing.testimonials.metricRating', 'Average Rating'),
      icon: <Star size={22} />,
      isRating: true,
    },
    {
      value: '150+',
      numValue: 150,
      label: t('marketing.testimonials.metricCountries', 'Countries'),
      icon: <Globe size={22} />,
    },
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute inset-0 dot-pattern" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 sm:p-12 animate-fade-in-up">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.04] mb-4 mx-auto">
                  <span className="text-[var(--color-accent-violet)]">{stat.icon}</span>
                </div>
                <div className="heading-xl gradient-text-brand !text-3xl sm:!text-4xl lg:!text-5xl mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">{stat.label}</div>
                {stat.isRating && (
                  <div className="mt-2 flex justify-center">
                    <StarRating rating={5} size={12} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Platform-Specific Results                                          */
/* ------------------------------------------------------------------ */
function PlatformResults() {
  const { t } = useTranslation();

  const platforms = [
    {
      name: 'LinkedIn',
      color: '#0A66C2',
      increase: '+285%',
      barWidth: 85,
      topResult: t(
        'marketing.testimonials.pr.linkedin',
        'Best case: 50K impressions on a single post',
      ),
      icon: <Globe size={18} />,
    },
    {
      name: 'Instagram',
      color: '#E1306C',
      increase: '+340%',
      barWidth: 95,
      topResult: t('marketing.testimonials.pr.instagram', 'Best case: 12K likes on a product post'),
      icon: <Star size={18} />,
    },
    {
      name: 'X / Twitter',
      color: '#9CA3AF',
      increase: '+210%',
      barWidth: 70,
      topResult: t('marketing.testimonials.pr.twitter', 'Best case: 2M impressions on a thread'),
      icon: <MessageSquare size={18} />,
    },
    {
      name: 'Facebook',
      color: '#1877F2',
      increase: '+195%',
      barWidth: 65,
      topResult: t(
        'marketing.testimonials.pr.facebook',
        'Best case: 25K shares on a community post',
      ),
      icon: <Globe size={18} />,
    },
    {
      name: 'TikTok',
      color: '#FF004F',
      increase: '+420%',
      barWidth: 100,
      topResult: t(
        'marketing.testimonials.pr.tiktok',
        'Best case: 1M views on an optimized description',
      ),
      icon: <Zap size={18} />,
    },
    {
      name: 'Pinterest',
      color: '#E60023',
      increase: '+260%',
      barWidth: 78,
      topResult: t(
        'marketing.testimonials.pr.pinterest',
        'Best case: 100K monthly pin impressions',
      ),
      icon: <Eye size={18} />,
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 grid-pattern" />
      <div
        className="orb w-72 h-72 top-[20%] right-[5%] bg-[var(--color-accent-magenta)]/10"
        style={{ animationDelay: '4s' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-glow-pulse mb-6">
            <TrendingUp size={14} className="text-[var(--color-accent-emerald)]" />
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide uppercase">
              {t('marketing.testimonials.resultsBadge', 'Platform Results')}
            </span>
          </div>
          <h2 className="heading-md text-white mb-4">
            {t('marketing.testimonials.resultsTitle', 'Results Across')}{' '}
            <span className="gradient-text-cool">
              {t('marketing.testimonials.resultsTitleHighlight', 'Every Platform')}
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map((platform, i) => (
            <div
              key={platform.name}
              className="glass-card p-6 group hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${platform.color}22` }}
                >
                  <span style={{ color: platform.color }}>{platform.icon}</span>
                </div>
                <div>
                  <div className="font-display font-bold text-white text-sm">{platform.name}</div>
                  <div className="text-[11px] text-[var(--color-text-muted)]">
                    {t('marketing.testimonials.avgEngagement', 'Avg. engagement increase')}
                  </div>
                </div>
                <div className="ml-auto">
                  <span className="heading-sm" style={{ color: platform.color }}>
                    {platform.increase}
                  </span>
                </div>
              </div>

              {/* Mini bar chart */}
              <div className="mb-4">
                <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${platform.barWidth}%`,
                      background: `linear-gradient(90deg, ${platform.color}88, ${platform.color})`,
                    }}
                  />
                </div>
              </div>

              {/* Top result */}
              <div className="flex items-start gap-2">
                <BarChart3
                  size={14}
                  className="text-[var(--color-text-muted)] flex-shrink-0 mt-0.5"
                />
                <span className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {platform.topResult}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Rating Sources                                                     */
/* ------------------------------------------------------------------ */
function RatingSources() {
  const { t } = useTranslation();

  const sources = [
    {
      name: 'Product Hunt',
      rating: 4.9,
      reviews: t('marketing.testimonials.ratingReviews.ph', '312 reviews'),
      color: '#DA552F',
    },
    {
      name: 'G2',
      rating: 4.8,
      reviews: t('marketing.testimonials.ratingReviews.g2', '189 reviews'),
      color: '#FF492C',
    },
    {
      name: 'Trustpilot',
      rating: 4.7,
      reviews: t('marketing.testimonials.ratingReviews.tp', '547 reviews'),
      color: '#00B67A',
    },
    {
      name: 'Capterra',
      rating: 4.9,
      reviews: t('marketing.testimonials.ratingReviews.cap', '96 reviews'),
      color: '#FF9D28',
    },
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute inset-0 dot-pattern" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="heading-sm text-white mb-2">
            {t('marketing.testimonials.ratingsTitle', 'What review platforms say')}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t(
              'marketing.testimonials.ratingsSubtitle',
              'Consistently top-rated across every major review platform',
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {sources.map((source, i) => (
            <div
              key={source.name}
              className="glass-card p-6 text-center group hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="font-display font-bold text-lg mb-1" style={{ color: source.color }}>
                {source.name}
              </div>

              <div className="heading-md text-white mb-2">{source.rating}/5</div>

              <div className="flex justify-center mb-3">
                <StarRating rating={Math.round(source.rating)} size={16} />
              </div>

              <div className="text-xs text-[var(--color-text-muted)]">{source.reviews}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Final CTA                                                          */
/* ------------------------------------------------------------------ */
function TestimonialsCTA() {
  const { t } = useTranslation();

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 mesh-gradient opacity-60" />
      <div className="absolute inset-0 grid-pattern" />

      <div className="orb w-80 h-80 top-[10%] left-[10%] bg-[var(--color-accent-violet)]/20" />
      <div
        className="orb w-60 h-60 bottom-[10%] right-[15%] bg-[var(--color-accent-magenta)]/15"
        style={{ animationDelay: '7s' }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="heading-md text-white mb-4 animate-fade-in-up">
          {t('marketing.testimonials.ctaTitle', 'Join the')}{' '}
          <span className="gradient-text-brand">
            {t('marketing.testimonials.ctaTitleHighlight', 'Community')}
          </span>
        </h2>

        <p
          className="text-lg text-[var(--color-text-secondary)] mb-10 max-w-2xl mx-auto animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          {t('marketing.testimonials.ctaSubtitle', 'Start your success story today')}
        </p>

        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Link to="/app" className="btn-primary-glow !text-lg !px-12 !py-5">
            {t('marketing.testimonials.ctaButton', 'Start Free')}
            <ArrowRight size={22} />
          </Link>
        </div>

        <p
          className="mt-6 text-xs text-[var(--color-text-muted)] animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          {t('marketing.testimonials.ctaNote', 'No credit card required')}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonials Page                                                  */
/* ------------------------------------------------------------------ */
export function TestimonialsPage() {
  return (
    <>
      <TestimonialsHero />
      <FeaturedTestimonial />
      <SuccessStoriesGrid />
      <StatsSection />
      <PlatformResults />
      <RatingSources />
      <TestimonialsCTA />
    </>
  );
}
