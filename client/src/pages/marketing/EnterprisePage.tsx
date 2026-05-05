import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Palette,
  BarChart3,
  Code,
  Shield,
  Headphones,
  ChevronDown,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Lock,
  Globe,
  Server,
  Clock,
  Send,
  Check,
  Zap,
  Phone,
  Calendar,
  BookOpen,
  Rocket,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';

/* ------------------------------------------------------------------ */
/*  Amber/Gold accent constants                                        */
/* ------------------------------------------------------------------ */
const AMBER = '#F59E0B';
const AMBER_DARK = '#D97706';
const AMBER_GLOW = 'rgba(245, 158, 11, 0.12)';
const AMBER_BORDER = 'rgba(245, 158, 11, 0.2)';
const AMBER_GLOW_STRONG = 'rgba(245, 158, 11, 0.15)';

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
            isOpen && 'rotate-180',
          )}
          style={isOpen ? { color: AMBER } : undefined}
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

  const logos = [
    t('marketing.enterprise.logo1', 'TechForward'),
    t('marketing.enterprise.logo2', 'MediaGroup'),
    t('marketing.enterprise.logo3', 'InnovateCo'),
    t('marketing.enterprise.logo4', 'ScaleUp Corp'),
    t('marketing.enterprise.logo5', 'DataPrime'),
  ];

  return (
    <section className="relative pt-28 pb-20 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 20% 40%, rgba(245, 158, 11, 0.06), transparent), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(217, 119, 6, 0.05), transparent), radial-gradient(ellipse 50% 60% at 60% 80%, rgba(139, 92, 246, 0.04), transparent)',
        }}
      />
      <div className="absolute inset-0 grid-pattern" />

      {/* Orbs */}
      <div
        className="orb w-72 h-72 top-[10%] left-[8%]"
        style={{ background: 'rgba(245, 158, 11, 0.08)' }}
      />
      <div
        className="orb w-80 h-80 top-[55%] right-[5%]"
        style={{ background: 'rgba(217, 119, 6, 0.06)', animationDelay: '7s' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-fade-in-up animate-glow-pulse mb-8">
          <Shield size={14} style={{ color: AMBER }} />
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide uppercase">
            {t('marketing.enterprise.heroBadge', 'Enterprise Solution')}
          </span>
        </div>

        {/* Headline */}
        <h1 className="heading-lg mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <span className="text-white block">
            {t('marketing.enterprise.heroTitle1', 'PostCommander for')}
          </span>
          <span
            className="bg-clip-text text-transparent block"
            style={{ backgroundImage: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK}, ${AMBER})` }}
          >
            {t('marketing.enterprise.heroTitle2', 'Enterprise')}
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-relaxed animate-fade-in-up mb-10"
          style={{ animationDelay: '0.2s' }}
        >
          {t(
            'marketing.enterprise.heroSubtitle',
            'Roll out PostCommander with multi-provider AI generation, direct publishing, security review, and hands-on onboarding for advanced teams.',
          )}
        </p>

        {/* Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up mb-16"
          style={{ animationDelay: '0.3s' }}
        >
          <a
            href="#contact"
            className="relative inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold text-white rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
            style={{
              fontFamily: 'var(--font-display)',
              background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})`,
              boxShadow: `0 0 30px ${AMBER_GLOW}, 0 4px 20px rgba(0,0,0,0.3)`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 50px ${AMBER_GLOW_STRONG}, 0 0 80px ${AMBER_GLOW}, 0 8px 30px rgba(0,0,0,0.4)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${AMBER_GLOW}, 0 4px 20px rgba(0,0,0,0.3)`;
            }}
          >
            {t('marketing.enterprise.ctaPrimary', 'Request a Demo')}
            <ArrowRight size={18} />
          </a>
          <a href="#contact" className="btn-ghost-glow">
            {t('marketing.enterprise.ctaSecondary', 'Talk to Sales')}
          </a>
        </div>

        {/* Logos bar */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-6">
            {t('marketing.enterprise.trustedBy', 'Trusted by teams at')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {logos.map((logo, i) => (
              <span
                key={i}
                className="text-sm sm:text-base font-bold text-[var(--color-text-muted)]/60 font-display tracking-wide"
              >
                {logo}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Enterprise Features                                                */
/* ------------------------------------------------------------------ */
function EnterpriseFeaturesSection() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Users,
      title: t('marketing.enterprise.feat1Title', 'Multi-User Rollout'),
      description: t(
        'marketing.enterprise.feat1Desc',
        'Launch with a shared operating model: authenticated access, user-scoped data, and practical rollout guidance for small teams or agencies.',
      ),
    },
    {
      icon: Palette,
      title: t('marketing.enterprise.feat2Title', 'Brand Systems'),
      description: t(
        'marketing.enterprise.feat2Desc',
        'Use writing styles, reusable templates, saved tones, and content pillars to keep outputs aligned with your brand voice.',
      ),
    },
    {
      icon: BarChart3,
      title: t('marketing.enterprise.feat3Title', 'Usage Visibility'),
      description: t(
        'marketing.enterprise.feat3Desc',
        'Review publishing history, analytics summaries, best-posting-time suggestions, and account-level usage before wider deployment.',
      ),
    },
    {
      icon: Code,
      title: t('marketing.enterprise.feat4Title', 'Automation Ready'),
      description: t(
        'marketing.enterprise.feat4Desc',
        'Use scheduling, direct publishing, and structured exports today, then scope deeper integrations with us during onboarding.',
      ),
    },
    {
      icon: Shield,
      title: t('marketing.enterprise.feat5Title', 'Security Controls'),
      description: t(
        'marketing.enterprise.feat5Desc',
        'Stored secrets are encrypted, password reset flows are hardened, and internal operations like queue monitoring are restricted to admin access.',
      ),
    },
    {
      icon: Headphones,
      title: t('marketing.enterprise.feat6Title', 'Guided Onboarding'),
      description: t(
        'marketing.enterprise.feat6Desc',
        'We help configure providers, social connections, billing, and operational guardrails before you expand usage across the organization.',
      ),
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute inset-0 dot-pattern" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('marketing.enterprise.featTitle1', 'Built for')}
            {' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}
            >
              {t('marketing.enterprise.featTitle2', 'Scale')}
            </span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="glass-card p-7 rounded-2xl group transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
              style={{
                animationDelay: `${i * 0.1}s`,
                borderColor: AMBER_BORDER,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${AMBER_GLOW}, 0 4px 40px rgba(0,0,0,0.3)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '';
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: AMBER_GLOW, border: `1px solid ${AMBER_BORDER}` }}
              >
                <feature.icon size={22} style={{ color: AMBER }} />
              </div>

              <h3 className="heading-sm text-white mb-3">{feature.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Security & Compliance                                              */
/* ------------------------------------------------------------------ */
function SecuritySection() {
  const { t } = useTranslation();

  const certifications = [
    {
      icon: Shield,
      title: t('marketing.enterprise.sec1Title', 'Authenticated Admin Access'),
      description: t('marketing.enterprise.sec1Desc', 'Operational dashboards are protected behind login and explicit admin authorization.'),
    },
    {
      icon: Globe,
      title: t('marketing.enterprise.sec2Title', 'Account Export Tools'),
      description: t('marketing.enterprise.sec2Desc', 'Users can download a machine-readable export of account data directly from settings.'),
    },
    {
      icon: Lock,
      title: t('marketing.enterprise.sec3Title', 'Account Deletion'),
      description: t('marketing.enterprise.sec3Desc', 'Authenticated users can permanently delete their account and active application data from the product UI.'),
    },
    {
      icon: Lock,
      title: t('marketing.enterprise.sec4Title', 'Encrypted Stored Secrets'),
      description: t('marketing.enterprise.sec4Desc', 'API keys and OAuth tokens are encrypted before they are persisted by the application.'),
    },
    {
      icon: Clock,
      title: t('marketing.enterprise.sec5Title', 'Queue Health Visibility'),
      description: t('marketing.enterprise.sec5Desc', 'Health checks now report database and background queue readiness instead of masking degraded scheduling.'),
    },
    {
      icon: Server,
      title: t('marketing.enterprise.sec6Title', 'Provider Choice'),
      description: t('marketing.enterprise.sec6Desc', 'Choose managed AI providers or local Ollama models depending on your privacy and deployment requirements.'),
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 grid-pattern" />
      <div
        className="orb w-56 h-56 top-[20%] left-[5%]"
        style={{ background: 'rgba(245, 158, 11, 0.06)', animationDelay: '4s' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('marketing.enterprise.secTitle1', 'Enterprise-Grade')}
            {' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}
            >
              {t('marketing.enterprise.secTitle2', 'Security')}
            </span>
          </h2>
        </div>

        <div className="glass-card p-8 sm:p-10 rounded-2xl animate-fade-in-up" style={{ borderColor: AMBER_BORDER }}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all duration-200"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: AMBER_GLOW, border: `1px solid ${AMBER_BORDER}` }}
                >
                  <cert.icon size={18} style={{ color: AMBER }} />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{cert.title}</h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {cert.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              {t(
                'marketing.enterprise.secNote',
                'Claims on this page describe the product as it exists today or services we explicitly scope with customers during rollout.',
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Scale Comparison                                                   */
/* ------------------------------------------------------------------ */
function ScaleComparisonSection() {
  const { t } = useTranslation();

  const businessFeatures = [
    t('marketing.enterprise.compBiz1', 'Advanced content generation'),
    t('marketing.enterprise.compBiz2', 'Analytics overview'),
    t('marketing.enterprise.compBiz3', 'Billing self-service'),
    t('marketing.enterprise.compBiz4', 'Content calendar'),
    t('marketing.enterprise.compBiz5', 'Brand voice presets'),
  ];

  const enterpriseFeatures = [
    t('marketing.enterprise.compEnt1', 'Provider and security review'),
    t('marketing.enterprise.compEnt2', 'Custom rollout planning'),
    t('marketing.enterprise.compEnt3', 'Account export and deletion workflows'),
    t('marketing.enterprise.compEnt4', 'Queue and billing hardening'),
    t('marketing.enterprise.compEnt5', 'Content system setup'),
    t('marketing.enterprise.compEnt6', 'Migration assistance'),
    t('marketing.enterprise.compEnt7', 'Hands-on onboarding'),
    t('marketing.enterprise.compEnt8', 'Scoped implementation support'),
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute inset-0 dot-pattern" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('marketing.enterprise.compTitle1', 'Plans That Scale')}
            {' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}
            >
              {t('marketing.enterprise.compTitle2', 'With You')}
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* Business card */}
          <div className="glass-card p-8 rounded-2xl animate-fade-in-up">
            <div className="mb-6">
              <h3 className="heading-sm text-white mb-1">
                {t('marketing.enterprise.compBizTitle', 'Business')}
              </h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold font-display text-white">{'\u20AC'}49</span>
                <span className="text-sm text-[var(--color-text-muted)]">
                  {t('marketing.enterprise.compPerMonth', '/month')}
                </span>
              </div>
            </div>

            <ul className="space-y-3">
              {businessFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check size={16} className="text-[var(--color-text-muted)] shrink-0" />
                  <span className="text-sm text-[var(--color-text-secondary)]">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/pricing"
              className="btn-ghost-glow w-full mt-8 !py-3 text-sm"
            >
              {t('marketing.enterprise.compBizCta', 'View Pricing')}
            </Link>
          </div>

          {/* Enterprise card */}
          <div
            className="glass-card p-8 rounded-2xl relative animate-fade-in-up"
            style={{
              animationDelay: '0.1s',
              border: `1px solid ${AMBER_BORDER}`,
              boxShadow: `0 0 40px ${AMBER_GLOW}, 0 4px 40px rgba(0,0,0,0.3)`,
            }}
          >
            {/* Recommended badge */}
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}
            >
              {t('marketing.enterprise.compRecommended', 'Recommended')}
            </div>

            <div className="mb-6 mt-2">
              <h3 className="heading-sm text-white mb-1">
                {t('marketing.enterprise.compEntTitle', 'Enterprise')}
              </h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span
                  className="text-3xl font-extrabold font-display bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}
                >
                  {t('marketing.enterprise.compCustom', 'Custom')}
                </span>
                <span className="text-sm text-[var(--color-text-muted)]">
                  {t('marketing.enterprise.compPricing', 'pricing')}
                </span>
              </div>
            </div>

            <ul className="space-y-3">
              {enterpriseFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check size={16} style={{ color: AMBER }} className="shrink-0" />
                  <span className="text-sm text-[var(--color-text-secondary)]">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="#contact"
              className="relative inline-flex items-center justify-center gap-2 w-full mt-8 py-3 font-semibold text-white text-sm rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
              style={{
                fontFamily: 'var(--font-display)',
                background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})`,
                boxShadow: `0 0 20px ${AMBER_GLOW}`,
              }}
            >
              {t('marketing.enterprise.compEntCta', 'Request a Demo')}
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Case Study                                                         */
/* ------------------------------------------------------------------ */
function CaseStudySection() {
  const { t } = useTranslation();

  const results = [
    { value: '4', label: t('marketing.enterprise.caseResult1', 'Core rollout stages') },
    { value: '2', label: t('marketing.enterprise.caseResult2', 'Critical production checks') },
    { value: '1', label: t('marketing.enterprise.caseResult3', 'Export and deletion workflow') },
    { value: '6', label: t('marketing.enterprise.caseResult4', 'Supported publishing platforms') },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(245, 158, 11, 0.04), transparent)',
        }}
      />
      <div className="absolute inset-0 grid-pattern" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('marketing.enterprise.caseTitle1', 'Example')}
            {' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}
            >
              {t('marketing.enterprise.caseTitle2', 'Rollout')}
            </span>
          </h2>
        </div>

        <div className="glass-card p-8 sm:p-10 lg:p-12 rounded-2xl animate-fade-in-up" style={{ borderColor: AMBER_BORDER }}>
          {/* Company */}
          <div className="mb-8">
            <h3 className="heading-sm text-white mb-1">
              {t('marketing.enterprise.caseCompany', 'Typical engagement')}
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              {t('marketing.enterprise.caseCompanyDesc', 'A marketing team validating PostCommander before a wider launch')}
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            {/* Challenge */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: AMBER }}>
                {t('marketing.enterprise.caseChallenge', 'Challenge')}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {t(
                  'marketing.enterprise.caseChallengeDesc',
                  'The team wants stronger controls over providers, publishing access, and operational readiness before more users adopt the product.',
                )}
              </p>
            </div>

            {/* Solution */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: AMBER }}>
                {t('marketing.enterprise.caseSolution', 'Solution')}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {t(
                  'marketing.enterprise.caseSolutionDesc',
                  'We align billing, settings, publishing connections, exports, deletion flows, and admin-only operational access before broader rollout.',
                )}
              </p>
            </div>

            {/* Timeline */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: AMBER }}>
                {t('marketing.enterprise.caseTimeline', 'Timeline')}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {t(
                  'marketing.enterprise.caseTimelineDesc',
                  'Start with a pilot workspace, validate the first workflow, then expand once the controls and content system are approved.',
                )}
              </p>
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 p-6 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            {results.map((result, i) => (
              <div key={i} className="text-center">
                <p
                  className="text-2xl sm:text-3xl font-extrabold font-display bg-clip-text text-transparent mb-1"
                  style={{ backgroundImage: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}
                >
                  {result.value}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] leading-snug">
                  {result.label}
                </p>
              </div>
            ))}
          </div>

          {/* Note */}
          <div className="flex items-start gap-4 p-6 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}
            >
              <span className="text-sm font-bold text-white font-display">PC</span>
            </div>
            <div>
              <p className="text-sm text-white leading-relaxed mb-3 italic">
                &ldquo;{t(
                  'marketing.enterprise.caseQuote',
                  'We use these rollout steps to scope what is already supported in the product versus what still needs implementation or customer-specific operating decisions.',
                )}&rdquo;
              </p>
              <p className="text-xs font-semibold text-white">
                {t('marketing.enterprise.caseQuoteAuthor', 'PostCommander team')}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {t('marketing.enterprise.caseQuoteRole', 'Rollout guidance')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Integration Ecosystem                                              */
/* ------------------------------------------------------------------ */
function IntegrationSection() {
  const { t } = useTranslation();

  const integrations = [
    t('marketing.enterprise.int1', 'OpenAI'),
    t('marketing.enterprise.int2', 'Anthropic'),
    t('marketing.enterprise.int3', 'Google'),
    t('marketing.enterprise.int4', 'Mistral'),
    t('marketing.enterprise.int5', 'Ollama'),
    t('marketing.enterprise.int6', 'LinkedIn'),
    t('marketing.enterprise.int7', 'X / Twitter'),
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute inset-0 dot-pattern" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="heading-sm text-white mb-10 animate-fade-in-up">
          {t('marketing.enterprise.intTitle1', 'Integrates With')}
          {' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}
          >
            {t('marketing.enterprise.intTitle2', 'Your Stack')}
          </span>
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {integrations.map((name, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass hover:bg-white/[0.06] transition-all duration-200"
            >
              <Zap size={14} style={{ color: AMBER }} />
              <span className="text-sm font-medium text-white">{name}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-[var(--color-text-muted)] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {t('marketing.enterprise.intNote', 'We currently help teams configure supported providers and publishing channels rather than advertising a public integration marketplace.')}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Onboarding Process                                                 */
/* ------------------------------------------------------------------ */
function OnboardingSection() {
  const { t } = useTranslation();

  const steps = [
    {
      num: '1',
      title: t('marketing.enterprise.onb1Title', 'Discovery Call'),
      description: t('marketing.enterprise.onb1Desc', 'We review goals, provider choices, publishing requirements, and the operational risks that need to be addressed first.'),
      timeline: t('marketing.enterprise.onb1Time', 'Day 1'),
      icon: Phone,
    },
    {
      num: '2',
      title: t('marketing.enterprise.onb2Title', 'Custom Setup & Brand Config'),
      description: t('marketing.enterprise.onb2Desc', 'We configure the initial workspace, provider settings, social connections, and content system foundations you actually plan to use.'),
      timeline: t('marketing.enterprise.onb2Time', 'Week 1'),
      icon: Calendar,
    },
    {
      num: '3',
      title: t('marketing.enterprise.onb3Title', 'Team Training & Workshops'),
      description: t('marketing.enterprise.onb3Desc', 'We walk through account export, deletion, billing, publishing, and the guardrails your operators need before launch.'),
      timeline: t('marketing.enterprise.onb3Time', 'Week 2'),
      icon: BookOpen,
    },
    {
      num: '4',
      title: t('marketing.enterprise.onb4Title', 'Go Live + Ongoing Support'),
      description: t('marketing.enterprise.onb4Desc', 'Launch the first validated workflow, then expand usage once the initial production checks are complete.'),
      timeline: t('marketing.enterprise.onb4Time', 'Week 3'),
      icon: Rocket,
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 grid-pattern" />
      <div
        className="orb w-64 h-64 bottom-[15%] right-[8%]"
        style={{ background: 'rgba(245, 158, 11, 0.06)', animationDelay: '5s' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('marketing.enterprise.onbTitle1', 'White-Glove')}
            {' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}
            >
              {t('marketing.enterprise.onbTitle2', 'Onboarding')}
            </span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting line (lg only) */}
          <div
            className="hidden lg:block absolute top-16 left-[calc(12.5%+1rem)] right-[calc(12.5%+1rem)] h-px"
            style={{ background: `linear-gradient(90deg, ${AMBER}, ${AMBER_DARK}, ${AMBER}, ${AMBER_DARK})`, opacity: 0.3 }}
          />

          {steps.map((step, i) => (
            <div
              key={i}
              className="glass-card p-6 rounded-2xl text-center relative animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Step number */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold text-white relative z-10"
                style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}
              >
                {step.num}
              </div>

              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: AMBER_GLOW, border: `1px solid ${AMBER_BORDER}` }}
              >
                <step.icon size={20} style={{ color: AMBER }} />
              </div>

              <h3 className="text-sm font-bold text-white mb-2">{step.title}</h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
                {step.description}
              </p>

              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: AMBER_GLOW, color: AMBER, border: `1px solid ${AMBER_BORDER}` }}
              >
                {step.timeline}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Contact Form                                                       */
/* ------------------------------------------------------------------ */
function ContactFormSection() {
  const { t } = useTranslation();
  const [formState, setFormState] = useState({
    fullName: '',
    workEmail: '',
    companyName: '',
    companySize: '10-50',
    currentTools: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.fullName && formState.workEmail && formState.companyName && formState.message) {
      setStatus('success');
      setFormState({
        fullName: '',
        workEmail: '',
        companyName: '',
        companySize: '10-50',
        currentTools: '',
        message: '',
      });
    } else {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const companySizeOptions = [
    { value: '10-50', label: t('marketing.enterprise.formSize1', '10 - 50 employees') },
    { value: '50-200', label: t('marketing.enterprise.formSize2', '50 - 200 employees') },
    { value: '200-500', label: t('marketing.enterprise.formSize3', '200 - 500 employees') },
    { value: '500-1000', label: t('marketing.enterprise.formSize4', '500 - 1,000 employees') },
    { value: '1000+', label: t('marketing.enterprise.formSize5', '1,000+ employees') },
  ];

  return (
    <section id="contact" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(245, 158, 11, 0.04), transparent)',
        }}
      />
      <div
        className="orb w-56 h-56 bottom-[10%] left-[5%]"
        style={{ background: 'rgba(245, 158, 11, 0.05)', animationDelay: '8s' }}
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('marketing.enterprise.contactTitle1', 'Get a Custom')}
            {' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}
            >
              {t('marketing.enterprise.contactTitle2', 'Quote')}
            </span>
          </h2>
        </div>

        {status === 'success' ? (
          <div className="glass-card p-12 rounded-2xl text-center animate-scale-in" style={{ borderColor: AMBER_BORDER }}>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: AMBER_GLOW, border: `1px solid ${AMBER_BORDER}` }}
            >
              <CheckCircle size={32} style={{ color: AMBER }} />
            </div>
            <h3 className="heading-sm text-white mb-3">
              {t('marketing.enterprise.contactSuccessTitle', 'Thank You!')}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t(
                'marketing.enterprise.contactSuccessDesc',
                'Our enterprise team will contact you within 24 hours.',
              )}
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-6 text-sm font-medium hover:text-white transition-colors"
              style={{ color: AMBER }}
            >
              {t('marketing.enterprise.contactAnother', 'Submit another inquiry')}
            </button>
          </div>
        ) : (
          <div className="glass-card p-8 sm:p-10 rounded-2xl animate-fade-in-up" style={{ borderColor: AMBER_BORDER }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="enterprise-name"
                    className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2"
                  >
                    {t('marketing.enterprise.formName', 'Full Name')}
                  </label>
                  <input
                    id="enterprise-name"
                    type="text"
                    value={formState.fullName}
                    onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                    placeholder={t('marketing.enterprise.formNamePh', 'Your full name')}
                    className="w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 transition-all"
                    style={{ '--tw-ring-color': `${AMBER}80` } as React.CSSProperties}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="enterprise-email"
                    className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2"
                  >
                    {t('marketing.enterprise.formEmail', 'Work Email')}
                  </label>
                  <input
                    id="enterprise-email"
                    type="email"
                    value={formState.workEmail}
                    onChange={(e) => setFormState({ ...formState, workEmail: e.target.value })}
                    placeholder={t('marketing.enterprise.formEmailPh', 'you@company.com')}
                    className="w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 transition-all"
                    style={{ '--tw-ring-color': `${AMBER}80` } as React.CSSProperties}
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="enterprise-company"
                    className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2"
                  >
                    {t('marketing.enterprise.formCompany', 'Company Name')}
                  </label>
                  <input
                    id="enterprise-company"
                    type="text"
                    value={formState.companyName}
                    onChange={(e) => setFormState({ ...formState, companyName: e.target.value })}
                    placeholder={t('marketing.enterprise.formCompanyPh', 'Your company')}
                    className="w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 transition-all"
                    style={{ '--tw-ring-color': `${AMBER}80` } as React.CSSProperties}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="enterprise-size"
                    className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2"
                  >
                    {t('marketing.enterprise.formSize', 'Company Size')}
                  </label>
                  <select
                    id="enterprise-size"
                    value={formState.companySize}
                    onChange={(e) => setFormState({ ...formState, companySize: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass text-sm text-white bg-transparent focus:outline-none focus:ring-1 transition-all appearance-none cursor-pointer"
                    style={{ '--tw-ring-color': `${AMBER}80` } as React.CSSProperties}
                  >
                    {companySizeOptions.map((opt) => (
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
                  htmlFor="enterprise-tools"
                  className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2"
                >
                  {t('marketing.enterprise.formTools', 'Current Social Media Tools')}
                </label>
                <textarea
                  id="enterprise-tools"
                  rows={2}
                  value={formState.currentTools}
                  onChange={(e) => setFormState({ ...formState, currentTools: e.target.value })}
                  placeholder={t(
                    'marketing.enterprise.formToolsPh',
                    'What tools does your team currently use?',
                  )}
                  className="w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 transition-all resize-none"
                  style={{ '--tw-ring-color': `${AMBER}80` } as React.CSSProperties}
                />
              </div>

              <div>
                <label
                  htmlFor="enterprise-message"
                  className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2"
                >
                  {t('marketing.enterprise.formMessage', 'Message')}
                </label>
                <textarea
                  id="enterprise-message"
                  rows={4}
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  placeholder={t(
                    'marketing.enterprise.formMessagePh',
                    'Tell us about your needs and goals...',
                  )}
                  className="w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 transition-all resize-none"
                  style={{ '--tw-ring-color': `${AMBER}80` } as React.CSSProperties}
                  required
                />
              </div>

              {/* Error */}
              {status === 'error' && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">
                    {t('marketing.enterprise.formError', 'Please fill in all required fields.')}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="submit"
                  className="relative inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold text-white rounded-2xl transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto"
                  style={{
                    fontFamily: 'var(--font-display)',
                    background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})`,
                    boxShadow: `0 0 30px ${AMBER_GLOW}`,
                  }}
                >
                  {t('marketing.enterprise.formSubmit', 'Request Demo')}
                  <Send size={16} />
                </button>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {t(
                    'marketing.enterprise.formEmailAlt',
                    'Or email us at enterprise@postcommander.com',
                  )}
                </span>
              </div>
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
function EnterpriseFAQSection() {
  const { t } = useTranslation();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const faqs = [
    {
      q: t('marketing.enterprise.faq1Q', 'Who is the custom rollout for?'),
      a: t(
        'marketing.enterprise.faq1A',
        'It fits teams that need more than a self-serve setup: multiple providers, stricter security review, migration help, or a controlled production rollout.',
      ),
    },
    {
      q: t('marketing.enterprise.faq2Q', 'Can we get a custom contract?'),
      a: t(
        'marketing.enterprise.faq2A',
        'Yes. For larger engagements we can scope commercial terms, onboarding work, and deployment expectations before go-live.',
      ),
    },
    {
      q: t('marketing.enterprise.faq3Q', 'How do you approach security questions?'),
      a: t(
        'marketing.enterprise.faq3A',
        'We review the current implementation with you directly: encrypted stored secrets, authenticated admin controls, account export/deletion, provider selection, and any deployment-specific requirements.',
      ),
    },
    {
      q: t('marketing.enterprise.faq4Q', 'How does the onboarding process work?'),
      a: t(
        'marketing.enterprise.faq4A',
        'We start with a discovery call, confirm your provider and platform setup, review guardrails, and then help you launch the first production workflow in a controlled window.',
      ),
    },
    {
      q: t('marketing.enterprise.faq5Q', 'Can we start before a larger rollout?'),
      a: t(
        'marketing.enterprise.faq5A',
        'Yes. Many customers begin with a paid Business workspace or a small pilot, then expand once the operational model is validated.',
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
            {t('marketing.enterprise.faqTitle1', 'Frequently Asked')}
            {' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})` }}
            >
              {t('marketing.enterprise.faqTitle2', 'Questions')}
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
/*  Enterprise Page (Exported)                                         */
/* ------------------------------------------------------------------ */
export function EnterprisePage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <HeroSection />
      <EnterpriseFeaturesSection />
      <SecuritySection />
      <ScaleComparisonSection />
      <CaseStudySection />
      <IntegrationSection />
      <OnboardingSection />
      <ContactFormSection />
      <EnterpriseFAQSection />
    </>
  );
}
