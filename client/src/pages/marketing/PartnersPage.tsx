import { useTranslation } from 'react-i18next';
import {
  UserPlus,
  Share2,
  Wallet,
  Megaphone,
  Building2,
  Code,
  GraduationCap,
  ChevronDown,
  Star,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Clock,
  BarChart3,
  LinkIcon,
  Image,
  Users,
  Zap,
  Send,
  Gift,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';

/* ------------------------------------------------------------------ */
/*  Accordion Item                                                     */
/* ------------------------------------------------------------------ */
function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden transition-all duration-200 hover:border-white/[0.1]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left group"
      >
        <span className="text-sm font-semibold text-white pr-4 group-hover:text-white/90 transition-colors">
          {question}
        </span>
        <ChevronDown
          size={18}
          className={clsx(
            'text-[var(--color-text-muted)] shrink-0 transition-transform duration-300',
            isOpen && 'rotate-180 text-[var(--color-accent-violet)]',
          )}
        />
      </button>
      <div
        className={clsx(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="px-6 pb-5 text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
          {answer}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero Section                                                       */
/* ------------------------------------------------------------------ */
function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative pt-28 pb-20 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 grid-pattern" />

      {/* Floating orbs */}
      <div className="orb w-72 h-72 top-[10%] left-[5%] bg-[var(--color-accent-blue)]/20" />
      <div
        className="orb w-80 h-80 top-[50%] right-[8%] bg-emerald-500/15"
        style={{ animationDelay: '7s' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-fade-in-up animate-glow-pulse mb-8">
          <Gift size={14} className="text-emerald-400" />
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide uppercase">
            {t('marketing.partners.heroBadge', 'Partner Program')}
          </span>
        </div>

        {/* Headline */}
        <h1 className="heading-lg mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <span className="text-white block">
            {t('marketing.partners.heroTitle1', 'Grow With')}
          </span>
          <span className="gradient-text-brand block">
            {t('marketing.partners.heroTitle2', 'Us')}
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed animate-fade-in-up mb-10"
          style={{ animationDelay: '0.2s' }}
        >
          {t(
            'marketing.partners.heroSubtitle',
            'Join the PostCommander Partner Program and earn recurring revenue while helping creators succeed.',
          )}
        </p>

        {/* Key stats banner */}
        <div
          className="glass-card inline-flex flex-wrap items-center justify-center gap-4 sm:gap-8 px-6 sm:px-10 py-5 rounded-2xl mb-10 animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-emerald-400" />
            <span className="text-sm font-bold text-white">
              {t('marketing.partners.stat1', '30% Recurring Commission')}
            </span>
          </div>
          <div className="hidden sm:block w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[var(--color-accent-blue)]" />
            <span className="text-sm font-bold text-white">
              {t('marketing.partners.stat2', '90-Day Cookie')}
            </span>
          </div>
          <div className="hidden sm:block w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-[var(--color-accent-violet)]" />
            <span className="text-sm font-bold text-white">
              {t('marketing.partners.stat3', 'Monthly Payouts')}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          <a href="#apply" className="btn-primary-glow">
            {t('marketing.partners.ctaPrimary', 'Become a Partner')}
            <ArrowRight size={18} />
          </a>
          <a href="#how-it-works" className="btn-ghost-glow">
            {t('marketing.partners.ctaSecondary', 'Learn More')}
            <ChevronDown size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How It Works                                                       */
/* ------------------------------------------------------------------ */
function HowItWorksSection() {
  const { t } = useTranslation();

  const steps = [
    {
      num: '01',
      icon: UserPlus,
      title: t('marketing.partners.step1Title', 'Sign Up'),
      description: t(
        'marketing.partners.step1Desc',
        'Apply in 2 minutes. Get your unique referral link and marketing materials instantly.',
      ),
      glowColor: 'var(--color-accent-blue)',
      glowBg: 'rgba(59, 130, 246, 0.08)',
      glowBorder: 'rgba(59, 130, 246, 0.15)',
    },
    {
      num: '02',
      icon: Share2,
      title: t('marketing.partners.step2Title', 'Share & Refer'),
      description: t(
        'marketing.partners.step2Desc',
        'Share PostCommander with your audience through your blog, social media, newsletter, or website.',
      ),
      glowColor: 'var(--color-accent-violet)',
      glowBg: 'rgba(139, 92, 246, 0.08)',
      glowBorder: 'rgba(139, 92, 246, 0.15)',
    },
    {
      num: '03',
      icon: Wallet,
      title: t('marketing.partners.step3Title', 'Earn 30%'),
      description: t(
        'marketing.partners.step3Desc',
        'Earn 30% recurring commission on every customer you refer. For as long as they stay subscribed.',
      ),
      glowColor: 'var(--color-accent-emerald)',
      glowBg: 'rgba(16, 185, 129, 0.08)',
      glowBorder: 'rgba(16, 185, 129, 0.15)',
    },
  ];

  return (
    <section id="how-it-works" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute inset-0 dot-pattern" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('marketing.partners.howTitle1', 'Simple, Transparent,')}{' '}
            <span className="gradient-text-brand">
              {t('marketing.partners.howTitle2', 'Rewarding')}
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative">
          {/* Connecting gradient lines (visible on md+) */}
          <div
            className="hidden md:block absolute top-1/2 left-[calc(33.33%-1rem)] right-[calc(33.33%-1rem)] h-px -translate-y-1/2"
            style={{
              background:
                'linear-gradient(90deg, var(--color-accent-blue), var(--color-accent-violet), var(--color-accent-emerald))',
            }}
          />

          {steps.map((step, i) => (
            <div
              key={i}
              className="glass-card p-8 rounded-2xl text-center relative group transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
              style={{
                animationDelay: `${i * 0.15}s`,
                boxShadow: `0 0 0 1px ${step.glowBorder}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  `0 0 40px ${step.glowBg}, 0 0 0 1px ${step.glowBorder}`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${step.glowBorder}`;
              }}
            >
              {/* Step number */}
              <div
                className="text-5xl font-extrabold font-display mb-4 bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${step.glowColor}, transparent 80%)`,
                  opacity: 0.3,
                }}
              >
                {step.num}
              </div>

              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: step.glowBg, border: `1px solid ${step.glowBorder}` }}
              >
                <step.icon size={24} style={{ color: step.glowColor }} />
              </div>

              <h3 className="heading-sm text-white mb-3">{step.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Earnings Calculator                                                */
/* ------------------------------------------------------------------ */
function EarningsCalculatorSection() {
  const { t } = useTranslation();
  const [referrals, setReferrals] = useState(10);
  const [plan, setPlan] = useState<'pro' | 'business'>('pro');

  const pricePerMonth = plan === 'pro' ? 19 : 49;
  const commissionRate = 0.3;
  const avgLifetime = 18;

  const monthly = Math.round(referrals * pricePerMonth * commissionRate);
  const annual = monthly * 12;
  const lifetime = Math.round(referrals * pricePerMonth * commissionRate * avgLifetime);

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 mesh-gradient opacity-30" />
      <div
        className="orb w-56 h-56 bottom-[20%] left-[10%] bg-[var(--color-accent-violet)]/10"
        style={{ animationDelay: '3s' }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('marketing.partners.calcTitle1', 'Calculate Your')}{' '}
            <span className="gradient-text-brand">
              {t('marketing.partners.calcTitle2', 'Earnings')}
            </span>
          </h2>
        </div>

        <div className="glass-card p-8 sm:p-10 rounded-2xl glow-border animate-fade-in-up">
          {/* Referrals slider */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-[var(--color-text-secondary)]">
                {t('marketing.partners.calcReferrals', 'Referrals per month')}
              </label>
              <span className="text-lg font-bold text-white font-display">{referrals}</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={referrals}
              onChange={(e) => setReferrals(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(90deg, var(--color-accent-blue) 0%, var(--color-accent-violet) ${referrals}%, rgba(255,255,255,0.06) ${referrals}%)`,
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-[var(--color-text-muted)]">1</span>
              <span className="text-xs text-[var(--color-text-muted)]">100</span>
            </div>
          </div>

          {/* Plan toggle */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <button
              onClick={() => setPlan('pro')}
              className={clsx(
                'px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                plan === 'pro'
                  ? 'glass-strong text-white border border-white/[0.12]'
                  : 'text-[var(--color-text-muted)] hover:text-white hover:bg-white/[0.04]',
              )}
            >
              {t('marketing.partners.calcPro', 'Pro Plan (19\u20AC)')}
            </button>
            <button
              onClick={() => setPlan('business')}
              className={clsx(
                'px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                plan === 'business'
                  ? 'glass-strong text-white border border-white/[0.12]'
                  : 'text-[var(--color-text-muted)] hover:text-white hover:bg-white/[0.04]',
              )}
            >
              {t('marketing.partners.calcBusiness', 'Business Plan (49\u20AC)')}
            </button>
          </div>

          {/* Results */}
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                {t('marketing.partners.calcMonthly', 'Monthly Revenue')}
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold font-display gradient-text-cool">
                {'\u20AC'}
                {monthly.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                {t('marketing.partners.calcAnnual', 'Annual Revenue')}
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold font-display gradient-text-brand">
                {'\u20AC'}
                {annual.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                {t('marketing.partners.calcLifetime', 'Lifetime Revenue')}
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold font-display gradient-text-cool">
                {'\u20AC'}
                {lifetime.toLocaleString()}
              </p>
            </div>
          </div>

          <p className="text-xs text-[var(--color-text-muted)] text-center mt-6">
            {t(
              'marketing.partners.calcNote',
              'Based on 30% commission and average customer lifetime of 18 months.',
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Partner Types                                                      */
/* ------------------------------------------------------------------ */
function PartnerTypesSection() {
  const { t } = useTranslation();

  const types = [
    {
      icon: Megaphone,
      title: t('marketing.partners.type1Title', 'Content Creators & Influencers'),
      description: t(
        'marketing.partners.type1Desc',
        'Share your honest review and earn from your recommendations.',
      ),
      bestFor: t(
        'marketing.partners.type1Best',
        'Best for: YouTubers, bloggers, newsletter authors',
      ),
      color: 'var(--color-accent-blue)',
      bg: 'rgba(59, 130, 246, 0.08)',
      border: 'rgba(59, 130, 246, 0.15)',
    },
    {
      icon: Building2,
      title: t('marketing.partners.type2Title', 'Marketing Agencies'),
      description: t(
        'marketing.partners.type2Desc',
        'White-label PostCommander for your clients and earn on every account.',
      ),
      bestFor: t(
        'marketing.partners.type2Best',
        'Best for: Digital agencies, social media managers',
      ),
      color: 'var(--color-accent-violet)',
      bg: 'rgba(139, 92, 246, 0.08)',
      border: 'rgba(139, 92, 246, 0.15)',
    },
    {
      icon: Code,
      title: t('marketing.partners.type3Title', 'SaaS & Tool Builders'),
      description: t(
        'marketing.partners.type3Desc',
        'Integrate PostCommander via API and earn on referred users.',
      ),
      bestFor: t('marketing.partners.type3Best', 'Best for: Complementary tools, platforms'),
      color: 'var(--color-accent-cyan)',
      bg: 'rgba(6, 182, 212, 0.08)',
      border: 'rgba(6, 182, 212, 0.15)',
    },
    {
      icon: GraduationCap,
      title: t('marketing.partners.type4Title', 'Educators & Coaches'),
      description: t(
        'marketing.partners.type4Desc',
        'Recommend PostCommander in your courses and workshops.',
      ),
      bestFor: t(
        'marketing.partners.type4Best',
        'Best for: Online course creators, business coaches',
      ),
      color: 'var(--color-accent-emerald)',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.15)',
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute inset-0 grid-pattern" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('marketing.partners.typesTitle1', 'Who Can Partner')}{' '}
            <span className="gradient-text-brand">
              {t('marketing.partners.typesTitle2', 'With Us?')}
            </span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {types.map((type, i) => (
            <div
              key={i}
              className="glass-card p-6 rounded-2xl group transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: type.bg, border: `1px solid ${type.border}` }}
              >
                <type.icon size={22} style={{ color: type.color }} />
              </div>

              <h3 className="heading-sm text-white mb-3">{type.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                {type.description}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] font-medium">{type.bestFor}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Partner Benefits                                                   */
/* ------------------------------------------------------------------ */
function BenefitsSection() {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: DollarSign,
      title: t('marketing.partners.benefit1Title', '30% Recurring Commission'),
      description: t(
        'marketing.partners.benefit1Desc',
        'Earn 30% of every payment your referrals make, every month, for as long as they stay.',
      ),
    },
    {
      icon: Clock,
      title: t('marketing.partners.benefit2Title', '90-Day Cookie Duration'),
      description: t(
        'marketing.partners.benefit2Desc',
        'Generous 90-day tracking window ensures you get credit for referrals who take their time.',
      ),
    },
    {
      icon: Wallet,
      title: t('marketing.partners.benefit3Title', 'Monthly Payouts via Stripe'),
      description: t(
        'marketing.partners.benefit3Desc',
        'Reliable monthly payouts directly to your bank account through Stripe.',
      ),
    },
    {
      icon: BarChart3,
      title: t('marketing.partners.benefit4Title', 'Real-time Dashboard & Analytics'),
      description: t(
        'marketing.partners.benefit4Desc',
        'Track clicks, conversions, and earnings in real-time with your dedicated dashboard.',
      ),
    },
    {
      icon: LinkIcon,
      title: t('marketing.partners.benefit5Title', 'Custom Referral Links'),
      description: t(
        'marketing.partners.benefit5Desc',
        'Create branded, custom referral links that match your content and campaigns.',
      ),
    },
    {
      icon: Image,
      title: t('marketing.partners.benefit6Title', 'Marketing Materials & Assets'),
      description: t(
        'marketing.partners.benefit6Desc',
        'Access banners, email templates, and social media assets to promote effectively.',
      ),
    },
    {
      icon: Users,
      title: t('marketing.partners.benefit7Title', 'Dedicated Partner Manager'),
      description: t(
        'marketing.partners.benefit7Desc',
        'Get a personal point of contact to help you maximize your earnings.',
      ),
    },
    {
      icon: Zap,
      title: t('marketing.partners.benefit8Title', 'Early Access to New Features'),
      description: t(
        'marketing.partners.benefit8Desc',
        'Be the first to try and promote new features before they go live.',
      ),
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 dot-pattern" />
      <div
        className="orb w-64 h-64 top-[20%] right-[5%] bg-[var(--color-accent-blue)]/10"
        style={{ animationDelay: '4s' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('marketing.partners.benefitsTitle1', 'Partner')}{' '}
            <span className="gradient-text-brand">
              {t('marketing.partners.benefitsTitle2', 'Benefits')}
            </span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {benefits.map((benefit, i) => (
            <div
              key={i}
              className="glass-card p-5 rounded-2xl group transition-all duration-300 hover:bg-white/[0.05] animate-fade-in-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-violet)]/10 border border-[var(--color-accent-violet)]/20 flex items-center justify-center mb-4">
                <benefit.icon size={18} className="text-[var(--color-accent-violet)]" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{benefit.title}</h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Current Partner Stats                                              */
/* ------------------------------------------------------------------ */
function PartnerStatsSection() {
  const { t } = useTranslation();

  const stats = [
    {
      value: t('marketing.partners.statVal1', '500+'),
      label: t('marketing.partners.statLabel1', 'Active Partners'),
    },
    {
      value: t('marketing.partners.statVal2', '\u20AC250K+'),
      label: t('marketing.partners.statLabel2', 'Paid Out'),
    },
    {
      value: t('marketing.partners.statVal3', '45%'),
      label: t('marketing.partners.statLabel3', 'Average Conversion'),
    },
    {
      value: t('marketing.partners.statVal4', '18-month'),
      label: t('marketing.partners.statLabel4', 'Avg Lifetime'),
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute inset-0 mesh-gradient opacity-20" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="gradient-border rounded-2xl">
          <div className="glass-card rounded-2xl p-8 sm:p-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="text-center animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display gradient-text-brand mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonial                                                        */
/* ------------------------------------------------------------------ */
function TestimonialSection() {
  const { t } = useTranslation();

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 dot-pattern" />
      <div
        className="orb w-48 h-48 top-[30%] left-[5%] bg-[var(--color-accent-magenta)]/10"
        style={{ animationDelay: '6s' }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 sm:p-12 rounded-2xl glow-border animate-fade-in-up">
          {/* Stars */}
          <div className="flex items-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={20} className="text-yellow-400 fill-yellow-400" />
            ))}
          </div>

          {/* Quote */}
          <blockquote className="text-base sm:text-lg text-white leading-relaxed mb-8 font-medium">
            &ldquo;
            {t(
              'marketing.partners.testimonialQuote',
              "PostCommander's partner program is the most generous I've seen in SaaS. The 30% recurring commission adds up fast \u2014 I'm earning \u20AC2,000/month just from recommending a tool I genuinely love.",
            )}
            &rdquo;
          </blockquote>

          {/* Author */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-accent-blue)] to-[var(--color-accent-violet)] flex items-center justify-center text-white font-bold text-sm font-display">
              AT
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {t('marketing.partners.testimonialAuthor', 'Alex Turner')}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {t(
                  'marketing.partners.testimonialRole',
                  'Creator Economy Newsletter (12K subscribers)',
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Application Form                                                   */
/* ------------------------------------------------------------------ */
function ApplicationFormSection() {
  const { t } = useTranslation();
  const [formState, setFormState] = useState({
    fullName: '',
    email: '',
    website: '',
    partnerType: 'creator',
    audienceSize: '<1k',
    promotion: '',
  });
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.fullName && formState.email && formState.website && formState.promotion) {
      setStatus('success');
      setFormState({
        fullName: '',
        email: '',
        website: '',
        partnerType: 'creator',
        audienceSize: '<1k',
        promotion: '',
      });
    } else {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const partnerTypeOptions = [
    { value: 'creator', label: t('marketing.partners.formTypeCreator', 'Creator') },
    { value: 'agency', label: t('marketing.partners.formTypeAgency', 'Agency') },
    { value: 'saas', label: t('marketing.partners.formTypeSaaS', 'SaaS Builder') },
    { value: 'educator', label: t('marketing.partners.formTypeEducator', 'Educator') },
    { value: 'other', label: t('marketing.partners.formTypeOther', 'Other') },
  ];

  const audienceSizeOptions = [
    { value: '<1k', label: t('marketing.partners.formAudienceXS', '< 1K') },
    { value: '1-10k', label: t('marketing.partners.formAudienceS', '1 - 10K') },
    { value: '10-50k', label: t('marketing.partners.formAudienceM', '10 - 50K') },
    { value: '50-100k', label: t('marketing.partners.formAudienceL', '50 - 100K') },
    { value: '100k+', label: t('marketing.partners.formAudienceXL', '100K+') },
  ];

  return (
    <section id="apply" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute inset-0 mesh-gradient opacity-20" />
      <div
        className="orb w-64 h-64 bottom-[10%] right-[5%] bg-emerald-500/10"
        style={{ animationDelay: '9s' }}
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('marketing.partners.applyTitle1', 'Apply to')}{' '}
            <span className="gradient-text-brand">
              {t('marketing.partners.applyTitle2', 'Join')}
            </span>
          </h2>
        </div>

        {status === 'success' ? (
          <div className="glass-card p-12 rounded-2xl text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
            <h3 className="heading-sm text-white mb-3">
              {t('marketing.partners.applySuccessTitle', 'Application Received!')}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t(
                'marketing.partners.applySuccessDesc',
                "We'll review your application within 48 hours. Check your email for next steps.",
              )}
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-6 text-sm text-[var(--color-accent-violet)] font-medium hover:text-white transition-colors"
            >
              {t('marketing.partners.applyAnother', 'Submit another application')}
            </button>
          </div>
        ) : (
          <div className="glass-card p-8 sm:p-10 rounded-2xl animate-fade-in-up">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="partner-name"
                    className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2"
                  >
                    {t('marketing.partners.formName', 'Full Name')}
                  </label>
                  <input
                    id="partner-name"
                    type="text"
                    value={formState.fullName}
                    onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                    placeholder={t('marketing.partners.formNamePh', 'Your full name')}
                    className="w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-violet)]/50 transition-all"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="partner-email"
                    className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2"
                  >
                    {t('marketing.partners.formEmail', 'Email')}
                  </label>
                  <input
                    id="partner-email"
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder={t('marketing.partners.formEmailPh', 'you@example.com')}
                    className="w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-violet)]/50 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="partner-website"
                  className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2"
                >
                  {t('marketing.partners.formWebsite', 'Website / Social URL')}
                </label>
                <input
                  id="partner-website"
                  type="url"
                  value={formState.website}
                  onChange={(e) => setFormState({ ...formState, website: e.target.value })}
                  placeholder={t('marketing.partners.formWebsitePh', 'https://your-website.com')}
                  className="w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-violet)]/50 transition-all"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="partner-type"
                    className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2"
                  >
                    {t('marketing.partners.formType', 'Partner Type')}
                  </label>
                  <select
                    id="partner-type"
                    value={formState.partnerType}
                    onChange={(e) => setFormState({ ...formState, partnerType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass text-sm text-white bg-transparent focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-violet)]/50 transition-all appearance-none cursor-pointer"
                  >
                    {partnerTypeOptions.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="bg-[var(--color-surface)] text-white"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="partner-audience"
                    className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2"
                  >
                    {t('marketing.partners.formAudience', 'Monthly Audience Size')}
                  </label>
                  <select
                    id="partner-audience"
                    value={formState.audienceSize}
                    onChange={(e) => setFormState({ ...formState, audienceSize: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass text-sm text-white bg-transparent focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-violet)]/50 transition-all appearance-none cursor-pointer"
                  >
                    {audienceSizeOptions.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="bg-[var(--color-surface)] text-white"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="partner-promotion"
                  className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2"
                >
                  {t('marketing.partners.formPromotion', 'How Will You Promote PostCommander?')}
                </label>
                <textarea
                  id="partner-promotion"
                  rows={4}
                  value={formState.promotion}
                  onChange={(e) => setFormState({ ...formState, promotion: e.target.value })}
                  placeholder={t(
                    'marketing.partners.formPromotionPh',
                    'Tell us about your audience and how you plan to promote PostCommander...',
                  )}
                  className="w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-violet)]/50 transition-all resize-none"
                  required
                />
              </div>

              {/* Error */}
              {status === 'error' && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">
                    {t('marketing.partners.formError', 'Please fill in all required fields.')}
                  </p>
                </div>
              )}

              <button type="submit" className="btn-primary-glow w-full sm:w-auto">
                {t('marketing.partners.formSubmit', 'Submit Application')}
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                                */
/* ------------------------------------------------------------------ */
function PartnerFAQSection() {
  const { t } = useTranslation();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const faqs = [
    {
      q: t('marketing.partners.faq1Q', 'How does the commission work?'),
      a: t(
        'marketing.partners.faq1A',
        'You earn 30% of every payment made by customers you refer. This is a recurring commission, meaning you earn every month for the lifetime of the customer. For example, if you refer someone who subscribes to the Pro plan at \u20AC19/month, you earn \u20AC5.70 every month they remain subscribed.',
      ),
    },
    {
      q: t('marketing.partners.faq2Q', 'When do I get paid?'),
      a: t(
        'marketing.partners.faq2A',
        "Commissions are paid out monthly via Stripe. Payouts are processed on the 1st of each month for the previous month's earnings. There is a 30-day hold period to account for refunds and chargebacks.",
      ),
    },
    {
      q: t('marketing.partners.faq3Q', 'Is there a minimum payout threshold?'),
      a: t(
        'marketing.partners.faq3A',
        'Yes, the minimum payout threshold is \u20AC50. If your balance is below this amount, it will roll over to the next month until the threshold is met.',
      ),
    },
    {
      q: t('marketing.partners.faq4Q', 'Can I promote in any language?'),
      a: t(
        'marketing.partners.faq4A',
        'Absolutely! You can promote PostCommander in any language. We provide marketing materials in English, French, Spanish, and German. For other languages, you are welcome to create your own materials following our brand guidelines.',
      ),
    },
    {
      q: t('marketing.partners.faq5Q', 'What marketing materials do you provide?'),
      a: t(
        'marketing.partners.faq5A',
        'We provide a comprehensive partner kit including: banner ads in multiple sizes, email templates, social media post templates, product screenshots, brand guidelines, and a detailed feature comparison sheet. All materials are available in your partner dashboard.',
      ),
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 dot-pattern" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('marketing.partners.faqTitle1', 'Frequently Asked')}{' '}
            <span className="gradient-text-brand">
              {t('marketing.partners.faqTitle2', 'Questions')}
            </span>
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              question={faq.q}
              answer={faq.a}
              isOpen={!!openItems[`faq-${i}`]}
              onToggle={() => toggleItem(`faq-${i}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Partners Page (Exported)                                           */
/* ------------------------------------------------------------------ */
export function PartnersPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <EarningsCalculatorSection />
      <PartnerTypesSection />
      <BenefitsSection />
      <PartnerStatsSection />
      <TestimonialSection />
      <ApplicationFormSection />
      <PartnerFAQSection />
    </>
  );
}
