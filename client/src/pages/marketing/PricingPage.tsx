import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Check,
  X as XIcon,
  ChevronDown,
  ArrowRight,
  Shield,
  Loader2,
} from 'lucide-react';
import clsx from 'clsx';
import { createCheckout } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

function getCheckoutErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Failed to start checkout. Please try again.';
}

/* ------------------------------------------------------------------ */
/*  Billing Toggle                                                     */
/* ------------------------------------------------------------------ */
function BillingToggle({
  yearly,
  onToggle,
}: {
  yearly: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center gap-4 mb-12">
      <span
        className={clsx(
          'text-sm font-medium transition-colors duration-200',
          !yearly ? 'text-white' : 'text-[var(--color-text-muted)]',
        )}
      >
        {t('pricing.monthly', 'Monthly')}
      </span>
      <button
        onClick={onToggle}
        className="relative w-14 h-7 rounded-full transition-all duration-300 glass border border-white/[0.1]"
      >
        <div
          className={clsx(
            'absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300',
            yearly
              ? 'translate-x-7 bg-gradient-to-r from-[var(--color-accent-blue)] to-[var(--color-accent-violet)]'
              : 'translate-x-0.5 bg-white/60',
          )}
        />
      </button>
      <span
        className={clsx(
          'text-sm font-medium transition-colors duration-200',
          yearly ? 'text-white' : 'text-[var(--color-text-muted)]',
        )}
      >
        {t('pricing.yearly', 'Yearly')}
      </span>
      {yearly && (
        <span className="px-3 py-1 rounded-full text-xs font-bold text-[var(--color-accent-emerald)] bg-[var(--color-accent-emerald)]/10 border border-[var(--color-accent-emerald)]/20">
          {t('pricing.save20', 'Save 20%')}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pricing Cards                                                      */
/* ------------------------------------------------------------------ */
function PricingCards({ yearly }: { yearly: boolean }) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    if (planId === 'free') return;

    if (!isAuthenticated) {
      navigate(`/register?plan=${planId}&interval=${yearly ? 'year' : 'month'}`);
      return;
    }

    setLoadingPlan(planId);
    setCheckoutError(null);
    try {
      const interval = yearly ? 'year' : 'month';
      const { url } = await createCheckout(planId, interval);
      window.location.href = url;
    } catch (err: unknown) {
      setCheckoutError(getCheckoutErrorMessage(err));
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      id: 'free',
      name: t('pricing.free.name', 'Free'),
      description: t('pricing.free.desc', 'Perfect for getting started'),
      monthlyPrice: 0,
      yearlyPrice: 0,
      popular: false,
      ctaText: t('pricing.free.cta', 'Get Started'),
      ctaLink: '/app',
      features: [
        { label: t('pricing.free.f1', '10 posts per month'), included: true },
        { label: t('pricing.free.f2', '1 AI provider'), included: true },
        { label: t('pricing.free.f3', '2 platforms'), included: true },
        { label: t('pricing.free.f4', '3 basic tones'), included: true },
        { label: t('pricing.free.f5', 'Post history (30 days)'), included: true },
        { label: t('pricing.free.f6', 'Community support'), included: true },
        { label: t('pricing.free.f7', 'Viral library access'), included: false },
        { label: t('pricing.free.f8', 'Hook generator'), included: false },
        { label: t('pricing.free.f9', 'Carousel/thread creator'), included: false },
        { label: t('pricing.free.f10', 'Template library'), included: false },
        { label: t('pricing.free.f11', 'Writing style cloning'), included: false },
        { label: t('pricing.free.f12', 'AI image generation'), included: false },
      ],
    },
    {
      id: 'pro',
      name: t('pricing.pro.name', 'Pro'),
      description: t('pricing.pro.desc', 'For serious content creators'),
      monthlyPrice: 19,
      yearlyPrice: 15,
      popular: true,
      ctaText: t('pricing.pro.cta', 'Go Pro'),
      ctaLink: '/app',
      features: [
        { label: t('pricing.pro.f1', 'Unlimited posts'), included: true },
        { label: t('pricing.pro.f2', 'All 5 AI providers'), included: true },
        { label: t('pricing.pro.f3', 'All 6 platforms'), included: true },
        { label: t('pricing.pro.f4', 'All 8 tones + custom'), included: true },
        { label: t('pricing.pro.f5', 'Unlimited history'), included: true },
        { label: t('pricing.pro.f6', 'Priority support'), included: true },
        { label: t('pricing.pro.f7', 'Viral library access'), included: true },
        { label: t('pricing.pro.f8', 'Hook generator'), included: true },
        { label: t('pricing.pro.f9', 'Carousel/thread creator'), included: true },
        { label: t('pricing.pro.f10', 'Template library'), included: true },
        { label: t('pricing.pro.f11', 'Hashtag research'), included: true },
        { label: t('pricing.pro.f12', 'Writing style cloning'), included: false },
        { label: t('pricing.pro.f13', 'AI image generation'), included: false },
        { label: t('pricing.pro.f14', 'Content pillars'), included: false },
        { label: t('pricing.pro.f15', 'Analytics dashboard'), included: false },
      ],
    },
    {
      id: 'business',
      name: t('pricing.business.name', 'Business'),
      description: t('pricing.business.desc', 'For advanced workflows and planning'),
      monthlyPrice: 49,
      yearlyPrice: 39,
      popular: false,
      ctaText: t('pricing.business.cta', 'Go Business'),
      ctaLink: '/app',
      features: [
        { label: t('pricing.business.f1', 'Everything in Pro'), included: true },
        { label: t('pricing.business.f2', 'Writing style cloning'), included: true },
        { label: t('pricing.business.f3', 'AI image generation'), included: true },
        { label: t('pricing.business.f4', 'Content repurposing'), included: true },
        { label: t('pricing.business.f5', 'Content pillars & idea planning'), included: true },
        { label: t('pricing.business.f6', 'Performance simulator'), included: true },
        { label: t('pricing.business.f7', 'Calendar & scheduling'), included: true },
        { label: t('pricing.business.f8', 'Analytics dashboard'), included: true },
        { label: t('pricing.business.f9', 'Best posting time insights'), included: true },
        { label: t('pricing.business.f10', 'Direct platform publishing'), included: true },
        { label: t('pricing.business.f11', 'Account export tools'), included: true },
      ],
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {plans.map((plan, idx) => {
        const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
        const isFree = plan.id === 'free';
        const isLoading = loadingPlan === plan.id;

        return (
          <div
            key={plan.name}
            className={clsx(
              'relative animate-fade-in-up',
              plan.popular && 'md:-mt-4 md:mb-[-16px] z-10',
            )}
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <span className="px-4 py-1.5 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-violet))' }}>
                  {t('pricing.mostPopular', 'Most Popular')}
                </span>
              </div>
            )}

            <div
              className={clsx(
                'relative h-full flex flex-col p-8 rounded-2xl border transition-all duration-300',
                plan.popular
                  ? 'bg-[var(--color-surface-raised)] border-white/[0.1] glow-border'
                  : 'glass-card hover:border-white/[0.1]',
              )}
            >
              <div className="mb-6">
                <h3 className="font-display text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-[var(--color-text-muted)]">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-display text-5xl font-extrabold text-white">{price}&euro;</span>
                <span className="text-sm text-[var(--color-text-muted)]">/{t('pricing.perMonth', 'month')}</span>
              </div>

              {yearly && plan.monthlyPrice > 0 && (
                <div className="mb-6">
                  <span className="text-sm text-[var(--color-text-muted)] line-through">{plan.monthlyPrice}&euro;/mo</span>
                  <span className="ml-2 text-sm font-medium text-[var(--color-accent-emerald)]">
                    {t('pricing.youSave', 'Save')} {(plan.monthlyPrice - plan.yearlyPrice) * 12}&euro;/{t('pricing.year', 'yr')}
                  </span>
                </div>
              )}

              {!yearly && <div className="mb-6" />}

              {checkoutError && (
                <p className="mb-4 text-xs text-red-400">{checkoutError}</p>
              )}

              {isFree ? (
                <Link
                  to={plan.ctaLink}
                  className={clsx(
                    'block w-full text-center py-3.5 rounded-xl font-display font-semibold text-sm transition-all duration-200 mb-8',
                    'btn-ghost-glow !py-3.5 !rounded-xl',
                  )}
                >
                  {plan.ctaText}
                </Link>
              ) : (
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={!!loadingPlan}
                  className={clsx(
                    'block w-full text-center py-3.5 rounded-xl font-display font-semibold text-sm transition-all duration-200 mb-8',
                    plan.popular
                      ? 'btn-primary-glow !py-3.5 !rounded-xl'
                      : 'btn-ghost-glow !py-3.5 !rounded-xl',
                    loadingPlan && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Redirecting...
                    </span>
                  ) : (
                    plan.ctaText
                  )}
                </button>
              )}

              <div className="flex-1">
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-4">
                  {t('pricing.includes', "What's included")}
                </p>
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-start gap-3">
                      {f.included ? (
                        <Check size={14} className="text-[var(--color-accent-emerald)] mt-0.5 shrink-0" />
                      ) : (
                        <XIcon size={14} className="text-white/10 mt-0.5 shrink-0" />
                      )}
                      <span
                        className={clsx(
                          'text-sm',
                          f.included
                            ? 'text-[var(--color-text-secondary)]'
                            : 'text-white/20',
                        )}
                      >
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature Comparison Table                                           */
/* ------------------------------------------------------------------ */
function ComparisonTable() {
  const { t } = useTranslation();

  const categories = [
    {
      name: t('pricing.table.contentGen', 'Content Generation'),
      features: [
        { name: t('pricing.table.posts', 'Posts per month'), free: '10', pro: t('pricing.table.unlimited', 'Unlimited'), business: t('pricing.table.unlimited', 'Unlimited') },
        { name: t('pricing.table.aiProviders', 'AI providers'), free: '1', pro: '5', business: '5' },
        { name: t('pricing.table.platforms', 'Platforms'), free: '2', pro: '6', business: '6' },
        { name: t('pricing.table.tones', 'Writing tones'), free: '3', pro: '8 + custom', business: '8 + custom' },
        { name: t('pricing.table.languages', 'Languages'), free: '2', pro: '8', business: '8' },
      ],
    },
    {
      name: t('pricing.table.tools', 'Tools'),
      features: [
        { name: t('pricing.table.viralLib', 'Viral post library'), free: false, pro: true, business: true },
        { name: t('pricing.table.hookGen', 'Hook generator'), free: false, pro: true, business: true },
        { name: t('pricing.table.carousel', 'Carousel/thread creator'), free: false, pro: true, business: true },
        { name: t('pricing.table.templates', 'Template library'), free: false, pro: true, business: true },
        { name: t('pricing.table.hashtags', 'Hashtag research'), free: false, pro: true, business: true },
        { name: t('pricing.table.repurpose', 'Content repurposing'), free: false, pro: false, business: true },
        { name: t('pricing.table.styleClone', 'Style cloning'), free: false, pro: false, business: true },
        { name: t('pricing.table.imageGen', 'AI image generation'), free: false, pro: false, business: true },
      ],
    },
    {
      name: t('pricing.table.management', 'Management'),
      features: [
        { name: t('pricing.table.history', 'Post history'), free: '30 days', pro: t('pricing.table.unlimited', 'Unlimited'), business: t('pricing.table.unlimited', 'Unlimited') },
        { name: t('pricing.table.calendar', 'Content calendar'), free: false, pro: false, business: true },
        { name: t('pricing.table.analytics', 'Analytics'), free: false, pro: false, business: true },
        { name: t('pricing.table.team', 'Content pillars'), free: false, pro: false, business: true },
        { name: t('pricing.table.api', 'Performance simulator'), free: false, pro: false, business: true },
      ],
    },
    {
      name: t('pricing.table.support', 'Support'),
      features: [
        { name: t('pricing.table.community', 'Community support'), free: true, pro: true, business: true },
        { name: t('pricing.table.priority', 'Priority support'), free: false, pro: true, business: true },
        { name: t('pricing.table.dedicated', 'Account export tools'), free: false, pro: false, business: true },
      ],
    },
  ];

  const renderCell = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check size={16} className="text-[var(--color-accent-emerald)] mx-auto" />
      ) : (
        <XIcon size={16} className="text-white/10 mx-auto" />
      );
    }
    return <span className="text-sm text-[var(--color-text-secondary)]">{value}</span>;
  };

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('pricing.compareTitle', 'Compare Plans')}
          </h2>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {/* Sticky header */}
          <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-white/[0.06] sticky top-16 lg:top-20 z-10 bg-[var(--color-surface-raised)]/90 backdrop-blur-xl">
            <div className="font-display text-sm font-bold text-[var(--color-text-muted)]">
              {t('pricing.table.feature', 'Feature')}
            </div>
            <div className="text-center font-display text-sm font-bold text-white">Free</div>
            <div className="text-center font-display text-sm font-bold gradient-text-brand">Pro</div>
            <div className="text-center font-display text-sm font-bold text-white">Business</div>
          </div>

          {categories.map((cat) => (
            <div key={cat.name}>
              {/* Category header */}
              <div className="px-6 py-3 bg-white/[0.02]">
                <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                  {cat.name}
                </span>
              </div>

              {cat.features.map((feature, fi) => (
                <div
                  key={feature.name}
                  className={clsx(
                    'grid grid-cols-4 gap-4 px-6 py-3 border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]',
                    fi === cat.features.length - 1 && 'border-b-white/[0.06]',
                  )}
                >
                  <div className="text-sm text-[var(--color-text-secondary)]">{feature.name}</div>
                  <div className="text-center">{renderCell(feature.free)}</div>
                  <div className="text-center">{renderCell(feature.pro)}</div>
                  <div className="text-center">{renderCell(feature.business)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Pricing FAQ                                                        */
/* ------------------------------------------------------------------ */
function PricingFAQ() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: t('pricing.faq.q1', 'Can I change my plan at any time?'),
      a: t('pricing.faq.a1', 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you will be charged the prorated difference. When downgrading, the remaining credit will be applied to your next billing cycle.'),
    },
    {
      q: t('pricing.faq.q2', 'What payment methods do you accept?'),
      a: t('pricing.faq.a2', 'We accept major credit cards through Stripe for the self-serve checkout flow.'),
    },
    {
      q: t('pricing.faq.q3', 'What if I have a billing issue?'),
      a: t('pricing.faq.a3', 'Contact support if you run into an unexpected billing problem. Billing questions are reviewed case by case.'),
    },
    {
      q: t('pricing.faq.q4', 'Do I need my own API keys?'),
      a: t('pricing.faq.a4', 'You can use your own API keys for the AI providers (OpenAI, Anthropic, Google, Mistral) or use our built-in quota which is included in your plan. Bring-your-own-key users get lower costs.'),
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)] dot-pattern" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('pricing.faqTitle', 'Pricing FAQ')}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl overflow-hidden transition-all duration-200 hover:border-white/[0.1] animate-fade-in-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="text-sm font-semibold text-white pr-4">
                  {faq.q}
                </span>
                <ChevronDown
                  size={18}
                  className={clsx(
                    'text-[var(--color-text-muted)] shrink-0 transition-transform duration-200',
                    openIndex === i && 'rotate-180',
                  )}
                />
              </button>
              <div
                className={clsx(
                  'overflow-hidden transition-all duration-300 ease-in-out',
                  openIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
                )}
              >
                <div className="px-6 pb-5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Pricing Page                                                       */
/* ------------------------------------------------------------------ */
export function PricingPage() {
  const { t } = useTranslation();
  const [yearly, setYearly] = useState(false);

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--color-void)]" />
        <div className="absolute inset-0 mesh-gradient opacity-40" />
        <div className="absolute inset-0 grid-pattern" />

        {/* Orbs */}
        <div className="orb w-64 h-64 top-[10%] left-[10%] bg-[var(--color-accent-blue)]/15" />
        <div className="orb w-48 h-48 top-[20%] right-[15%] bg-[var(--color-accent-violet)]/10" style={{ animationDelay: '8s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="heading-lg text-white mb-6 animate-fade-in-up">
            {t('pricing.title', 'Simple, Transparent')}
            {' '}
            <span className="gradient-text-brand">
              {t('pricing.titleHighlight', 'Pricing')}
            </span>
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {t('pricing.subtitle', 'Start free and upgrade when you need more. No hidden fees, no surprises.')}
          </p>

          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <BillingToggle yearly={yearly} onToggle={() => setYearly(!yearly)} />
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="relative pb-24 -mt-4">
        <div className="absolute inset-0 bg-[var(--color-void)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PricingCards yearly={yearly} />
        </div>
      </section>

      {/* Guarantee */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--color-surface)]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card flex flex-col md:flex-row items-center gap-6 p-8 rounded-2xl animate-fade-in-up">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-violet))' }}>
              <Shield size={24} className="text-white" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-display text-base font-bold text-white mb-1">
                {t('pricing.guarantee.title', 'Start monthly, cancel anytime')}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('pricing.guarantee.desc', 'Most teams begin on monthly billing, validate the workflow, then switch to annual billing once the rollout is proven.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <ComparisonTable />

      {/* FAQ */}
      <PricingFAQ />

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--color-void)]" />
        <div className="absolute inset-0 mesh-gradient opacity-50" />

        <div className="orb w-72 h-72 top-[10%] left-[10%] bg-[var(--color-accent-blue)]/15" />
        <div className="orb w-56 h-56 bottom-[10%] right-[15%] bg-[var(--color-accent-magenta)]/10" style={{ animationDelay: '7s' }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-lg text-white mb-6 animate-fade-in-up">
            {t('pricing.ctaTitle', 'Ready to Supercharge Your Content?')}
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {t('pricing.ctaSubtitle', 'Start with the Free plan and upgrade anytime. No credit card required.')}
          </p>

          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/app" className="btn-primary-glow !text-lg !px-12 !py-5">
              {t('pricing.ctaButton', 'Get Started Free')}
              <ArrowRight size={22} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
