import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  ChevronDown,
  HelpCircle,
  Bot,
  CreditCard,
  Globe,
  Shield,
  ArrowRight,
  Wrench,
} from 'lucide-react';
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
/*  FAQ Page                                                           */
/* ------------------------------------------------------------------ */
export function FAQPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const categories = useMemo(
    () => [
      {
        id: 'general',
        icon: HelpCircle,
        title: t('faq.general.title', 'General'),
        items: [
          {
            q: t('faq.general.q1', 'What is PostCommander?'),
            a: t(
              'faq.general.a1',
              'PostCommander is an AI-powered social media content creation and management platform. It uses multiple leading AI models (GPT-4, Claude, Gemini, Mistral, and Ollama) to generate optimized posts for 6 major social platforms in 8 languages.',
            ),
          },
          {
            q: t('faq.general.q2', 'How does PostCommander work?'),
            a: t(
              'faq.general.a2',
              'Simply enter your topic or idea, choose your target platforms and preferred tone, select an AI model, and click Generate. PostCommander creates platform-optimized posts in seconds. You can then edit, schedule, or publish directly.',
            ),
          },
          {
            q: t('faq.general.q3', 'Which social media platforms are supported?'),
            a: t(
              'faq.general.a3',
              'PostCommander supports LinkedIn, X (Twitter), Facebook, Instagram, TikTok, and Pinterest. Each post is automatically optimized for the specific requirements of each platform, including character limits, hashtag conventions, and formatting.',
            ),
          },
          {
            q: t('faq.general.q4', 'Do I need technical skills to use it?'),
            a: t(
              'faq.general.a4',
              'Not at all! PostCommander is designed for everyone, from solo entrepreneurs to large marketing teams. If you can type a sentence, you can create professional social media content. No coding or technical knowledge required.',
            ),
          },
          {
            q: t('faq.general.q5', 'Can I use PostCommander on mobile?'),
            a: t(
              'faq.general.a5',
              'Yes! PostCommander is fully responsive and works beautifully on smartphones, tablets, and desktops. Access your account from any device with a web browser.',
            ),
          },
        ],
      },
      {
        id: 'pricing',
        icon: CreditCard,
        title: t('faq.pricing.title', 'Pricing'),
        items: [
          {
            q: t('faq.pricing.q1', 'Is there really a free plan?'),
            a: t(
              'faq.pricing.a1',
              'Absolutely! Our Free plan includes 10 posts per month, access to 1 AI provider, 2 platforms, and basic tones. No credit card required. It is the perfect way to try PostCommander before committing to a paid plan.',
            ),
          },
          {
            q: t('faq.pricing.q2', 'What payment methods do you accept?'),
            a: t(
              'faq.pricing.a2',
              'We accept major credit cards through Stripe for the self-serve checkout flow.',
            ),
          },
          {
            q: t('faq.pricing.q3', 'Can I cancel my subscription at any time?'),
            a: t(
              'faq.pricing.a3',
              'Yes, you can cancel at any time with no penalties. Your plan will remain active until the end of your current billing period. After cancellation, your account reverts to the Free plan, and your data is preserved.',
            ),
          },
          {
            q: t('faq.pricing.q4', 'What if I have a billing issue?'),
            a: t(
              'faq.pricing.a4',
              'Contact support if you hit an unexpected billing issue. Billing questions are reviewed case by case.',
            ),
          },
          {
            q: t('faq.pricing.q5', 'Can I switch between plans?'),
            a: t(
              'faq.pricing.a5',
              'Yes! You can upgrade or downgrade at any time. When upgrading, you pay the prorated difference immediately. When downgrading, the remaining balance is credited to your next billing cycle.',
            ),
          },
          {
            q: t('faq.pricing.q6', 'Do I need my own API keys?'),
            a: t(
              'faq.pricing.a6',
              'It depends on your plan. Paid plans include a usage quota. You can also bring your own API keys for OpenAI, Anthropic, Google, or Mistral to get potentially lower per-token costs and more control. Ollama is always free since it runs locally.',
            ),
          },
        ],
      },
      {
        id: 'ai',
        icon: Bot,
        title: t('faq.ai.title', 'AI Models'),
        items: [
          {
            q: t('faq.ai.q1', 'Which AI models are available?'),
            a: t(
              'faq.ai.a1',
              'PostCommander integrates with 5 AI providers:\n\n- OpenAI (GPT-4, GPT-4 Turbo) - Excellent for creative, engaging content\n- Anthropic (Claude) - Great for nuanced, professional writing\n- Google (Gemini) - Strong at factual, research-based content\n- Mistral - Outstanding for multilingual content\n- Ollama - Free, local AI models for complete privacy',
            ),
          },
          {
            q: t('faq.ai.q2', 'How is the content quality?'),
            a: t(
              'faq.ai.a2',
              'The content quality is excellent and constantly improving. Our prompting system is specifically engineered for social media, incorporating best practices for engagement, readability, and platform-specific optimization. You can always edit and refine the generated content.',
            ),
          },
          {
            q: t('faq.ai.q3', 'Which languages are supported for content generation?'),
            a: t(
              'faq.ai.a3',
              'PostCommander supports content generation in 8 languages: English, French, Spanish, German, Portuguese, Arabic, Chinese, and Japanese. Each language is tuned for natural, native-quality output with cultural awareness.',
            ),
          },
          {
            q: t('faq.ai.q4', 'Will my content be unique and not plagiarized?'),
            a: t(
              'faq.ai.a4',
              'Yes. All AI-generated content is original and created specifically for your request. The AI models generate new text each time, so you get unique content. We recommend reviewing and adding your personal touch for the best results.',
            ),
          },
          {
            q: t('faq.ai.q5', 'Can the AI match my writing style?'),
            a: t(
              'faq.ai.a5',
              'Yes! With the Writing Style Cloning feature (Business plan), you can provide samples of your writing and the AI will learn your unique voice, vocabulary, and sentence structure. It then generates new content that sounds authentically like you.',
            ),
          },
        ],
      },
      {
        id: 'platforms',
        icon: Globe,
        title: t('faq.platforms.title', 'Platforms'),
        items: [
          {
            q: t('faq.platforms.q1', 'How do I connect my social media accounts?'),
            a: t(
              'faq.platforms.a1',
              'Go to Settings > Platform Connections and click "Connect" for each platform. You will be redirected to authorize PostCommander through each platform\'s official OAuth flow. Your credentials are never stored on our servers.',
            ),
          },
          {
            q: t('faq.platforms.q2', 'Can I publish directly to social media?'),
            a: t(
              'faq.platforms.a2',
              'Yes! Once your accounts are connected, you can publish posts directly from PostCommander. You can also save drafts, schedule posts for later, or copy the content to publish manually.',
            ),
          },
          {
            q: t('faq.platforms.q3', 'Can I schedule posts in advance?'),
            a: t(
              'faq.platforms.a3',
              'Yes, with the Business plan. Use the Content Calendar to schedule posts for specific dates and times. PostCommander will automatically publish them at the scheduled time.',
            ),
          },
          {
            q: t('faq.platforms.q4', 'Does PostCommander auto-format for each platform?'),
            a: t(
              'faq.platforms.a4',
              'Absolutely. Each generated post is automatically optimized for its target platform, including character limits, hashtag placement, emoji usage, and formatting conventions. A LinkedIn post looks different from a tweet by design.',
            ),
          },
        ],
      },
      {
        id: 'technical',
        icon: Wrench,
        title: t('faq.technical.title', 'Technical'),
        items: [
          {
            q: t('faq.technical.q1', 'Is there an API available?'),
            a: t(
              'faq.technical.a1',
              'PostCommander does not currently advertise a public developer API. Today, most automation happens through built-in scheduling, direct publishing, and exports.',
            ),
          },
          {
            q: t('faq.technical.q2', 'Can I run AI models locally?'),
            a: t(
              'faq.technical.a2',
              'Yes! With Ollama integration, you can run AI models entirely on your local machine. This means your content never leaves your computer - perfect for industries with strict data requirements or sensitive topics.',
            ),
          },
          {
            q: t('faq.technical.q3', 'What browsers are supported?'),
            a: t(
              'faq.technical.a3',
              'PostCommander works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated to the latest version for the best experience.',
            ),
          },
          {
            q: t('faq.technical.q4', 'Is there a mobile app?'),
            a: t(
              'faq.technical.a4',
              'PostCommander is a progressive web app (PWA) that works beautifully on mobile browsers. You can add it to your home screen for an app-like experience. A native mobile app is on our roadmap.',
            ),
          },
        ],
      },
      {
        id: 'security',
        icon: Shield,
        title: t('faq.security.title', 'Security'),
        items: [
          {
            q: t('faq.security.q1', 'How is my data handled?'),
            a: t(
              'faq.security.a1',
              'We store the account, settings, and content data needed to run the product. Sensitive stored secrets are encrypted, and access to internal operational tooling is restricted to authenticated admins.',
            ),
          },
          {
            q: t('faq.security.q2', 'Are my API keys secure?'),
            a: t(
              'faq.security.a2',
              'Yes. API keys are encrypted and stored securely. They are only used to make requests to the respective AI providers on your behalf. Keys are never logged, displayed in full, or accessible to our team.',
            ),
          },
          {
            q: t('faq.security.q3', 'Can I export or delete my account data?'),
            a: t(
              'faq.security.a3',
              'Yes. The settings page includes a self-serve JSON export plus a permanent account deletion flow for active application data. For additional legal requests, contact support.',
            ),
          },
          {
            q: t('faq.security.q4', 'Can I use PostCommander without cloud AI?'),
            a: t(
              'faq.security.a4',
              'Yes! With Ollama integration, you can run AI models entirely on your local machine. Your content never leaves your computer, providing complete privacy for sensitive topics or industries with strict data requirements.',
            ),
          },
          {
            q: t('faq.security.q5', 'Who can see my generated content?'),
            a: t(
              'faq.security.a5',
              'Only authenticated users on the account can access the content stored in the app. We do not sell your generated content or use it as marketing collateral.',
            ),
          },
        ],
      },
    ],
    [t],
  );

  // Filter by search and category
  const filteredCategories = useMemo(() => {
    let result = categories;

    if (activeCategory) {
      result = result.filter((cat) => cat.id === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result
        .map((cat) => ({
          ...cat,
          items: cat.items.filter(
            (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q),
          ),
        }))
        .filter((cat) => cat.items.length > 0);
    }

    return result;
  }, [categories, searchQuery, activeCategory]);

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--color-void)]" />
        <div className="absolute inset-0 mesh-gradient opacity-30" />
        <div className="absolute inset-0 grid-pattern" />

        <div className="orb w-56 h-56 top-[15%] right-[10%] bg-[var(--color-accent-blue)]/10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="heading-lg text-white mb-6 animate-fade-in-up">
            {t('faq.title', 'Frequently Asked')}{' '}
            <span className="gradient-text-brand">{t('faq.titleHighlight', 'Questions')}</span>
          </h1>
          <p
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10 animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            {t('faq.subtitle', 'Find answers to common questions about PostCommander.')}
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('faq.searchPlaceholder', 'Search questions...')}
                className="w-full pl-12 pr-4 py-4 rounded-2xl glass text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-violet)]/50 transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <section
        className="sticky top-16 lg:top-20 z-40 border-b border-white/[0.04]"
        style={{ background: 'rgba(6,6,15,0.8)', backdropFilter: 'blur(24px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveCategory(null)}
              className={clsx(
                'px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200',
                !activeCategory
                  ? 'glass text-white border border-white/[0.1]'
                  : 'text-[var(--color-text-muted)] hover:text-white hover:bg-white/[0.04]',
              )}
            >
              {t('faq.all', 'All')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200',
                  activeCategory === cat.id
                    ? 'glass text-white border border-white/[0.1]'
                    : 'text-[var(--color-text-muted)] hover:text-white hover:bg-white/[0.04]',
                )}
              >
                <cat.icon size={14} />
                {cat.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ sections */}
      <section className="relative py-16">
        <div className="absolute inset-0 bg-[var(--color-void)] dot-pattern" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {filteredCategories.map((cat) => (
            <div key={cat.id} id={cat.id}>
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-violet))',
                  }}
                >
                  <cat.icon size={16} className="text-white" />
                </div>
                <h2 className="font-display text-lg font-bold text-white">{cat.title}</h2>
              </div>

              <div className="space-y-3">
                {cat.items.map((item, idx) => {
                  const key = `${cat.id}-${idx}`;
                  return (
                    <AccordionItem
                      key={key}
                      question={item.q}
                      answer={item.a}
                      isOpen={!!openItems[key]}
                      onToggle={() => toggleItem(key)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="text-center py-16">
              <HelpCircle size={40} className="mx-auto text-white/10 mb-4" />
              <p className="text-sm font-medium text-[var(--color-text-muted)]">
                {t('faq.noResults', 'No questions match your search.')}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory(null);
                }}
                className="mt-4 text-sm text-[var(--color-accent-violet)] font-medium hover:text-white transition-colors"
              >
                {t('faq.clearSearch', 'Clear search')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--color-surface)]" />
        <div className="absolute inset-0 mesh-gradient opacity-30" />

        <div className="orb w-56 h-56 top-[20%] left-[10%] bg-[var(--color-accent-violet)]/10" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-lg text-white mb-6 animate-fade-in-up">
            {t('faq.ctaTitle', 'Still Have Questions?')}
          </h2>
          <p
            className="text-lg text-[var(--color-text-secondary)] mb-10 max-w-2xl mx-auto animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            {t(
              'faq.ctaSubtitle',
              "Our team is here to help. Contact us and we'll get back to you within 24 hours.",
            )}
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            <Link to="/app" className="btn-primary-glow !text-lg !px-10 !py-5">
              {t('faq.ctaButton', 'Get Started Free')}
              <ArrowRight size={22} />
            </Link>
            <a
              href="mailto:support@postcommander.com"
              className="btn-ghost-glow !text-lg !px-10 !py-5"
            >
              {t('faq.ctaContact', 'Contact Support')}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
