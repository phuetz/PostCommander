import { useTranslation } from 'react-i18next';
import { Shield, ArrowUp } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import clsx from 'clsx';

/* ------------------------------------------------------------------ */
/*  Privacy Policy Data                                                 */
/* ------------------------------------------------------------------ */
function usePrivacySections() {
  const { t } = useTranslation();

  return [
    {
      id: 'introduction',
      title: t('marketing.privacy.s1Title', '1. Introduction & Controller'),
      content: t(
        'marketing.privacy.s1Content',
        'This Privacy Policy explains how PostCommander collects, uses, and protects personal data when you use the service.\n\nFor the hosted service, the PostCommander operator acts as the controller for account data processed through the product. If you run the application yourself, your organization is responsible for how it is deployed and operated.\n\nContact:\nprivacy@postcommander.com',
      ),
    },
    {
      id: 'data-collected',
      title: t('marketing.privacy.s2Title', '2. Data We Collect'),
      content: t(
        'marketing.privacy.s2Content',
        'We collect the following categories of data when you use the service:\n\nAccount Information: Your email address, password hash, optional name, subscription state, and account timestamps.\n\nSettings and Connected Services: Provider settings, encrypted API keys, encrypted social platform tokens, and platform metadata needed for publishing.\n\nContent Data: Prompts, generated posts, templates, writing styles, analytics snapshots, images, and planning data you create inside the app.\n\nBilling Data: Subscription status, invoice metadata, and Stripe customer references. Full card details are handled by Stripe, not stored by PostCommander.\n\nOperational Data: Authentication cookies, password reset requests, and service logs needed to secure and operate the application.',
      ),
    },
    {
      id: 'how-we-use',
      title: t('marketing.privacy.s3Title', '3. How We Use Your Data'),
      content: t(
        'marketing.privacy.s3Content',
        'We process your personal data for the following purposes and legal bases:\n\nService Delivery (Contract Performance): To create and maintain your account, generate content based on your inputs, provide customer support, and deliver the features of the Service.\n\nService Improvement (Legitimate Interest): To analyze usage patterns, diagnose technical issues, develop new features, and improve the quality of AI-generated content.\n\nCommunications (Consent / Legitimate Interest): To send you service updates, security notifications, and, with your consent, marketing communications about new features and tips.\n\nLegal Compliance (Legal Obligation): To comply with applicable laws, regulations, and legal processes, including tax and accounting requirements.\n\nFraud Prevention (Legitimate Interest): To detect, prevent, and address fraud, security breaches, and abuse of the Service.',
      ),
    },
    {
      id: 'ai-third-parties',
      title: t('marketing.privacy.s4Title', '4. AI Processing & Third Parties'),
      content: t(
        'marketing.privacy.s4Content',
        "To generate content, we transmit your prompts and generation parameters to third-party AI providers. The providers we use include:\n\nOpenAI (USA): Processes prompts through GPT models. Subject to OpenAI's API data usage policy — API data is not used for training.\n\nAnthropic (USA): Processes prompts through Claude models. Subject to Anthropic's API terms — API inputs and outputs are not used for model training.\n\nGoogle (USA): Processes prompts through Gemini models. Subject to Google Cloud's data processing terms.\n\nMistral AI (France/EU): Processes prompts through Mistral models. Data processed within the EU.\n\nOllama (Local): When using local models, your data remains entirely on your device and is not transmitted to any third party.\n\nWe select providers that commit to not using API data for model training. However, we recommend not including sensitive personal data in your content generation prompts.",
      ),
    },
    {
      id: 'social-media',
      title: t('marketing.privacy.s5Title', '5. Social Media Platform Data'),
      content: t(
        'marketing.privacy.s5Content',
        "If you connect your social media accounts to PostCommander for publishing, we access only the permissions strictly necessary for content publishing. We do not access your private messages, contact lists, or non-public profile information.\n\nThe social media platforms we integrate with include LinkedIn, X (Twitter), Facebook, Instagram, TikTok, and Pinterest. Each platform's data processing is governed by their respective privacy policies. We encourage you to review the privacy policies of any social media platforms you connect.",
      ),
    },
    {
      id: 'storage-security',
      title: t('marketing.privacy.s6Title', '6. Data Storage & Security'),
      content: t(
        'marketing.privacy.s6Content',
        'Security controls currently implemented in the product include:\n\n- Password hashing for local accounts\n- Encryption for stored API keys and OAuth tokens\n- Authenticated access to user data and admin-only access to internal queue tooling\n- OAuth state validation and hardened password reset tokens\n- Health checks for database and background queue readiness\n\nData location depends on the environment where the service is deployed and the providers you choose to connect. No online service can guarantee absolute security, so you should avoid placing highly sensitive personal data in generation prompts unless your own policy approves it.',
      ),
    },
    {
      id: 'stripe',
      title: t('marketing.privacy.s7Title', '7. Stripe Payment Processing'),
      content: t(
        'marketing.privacy.s7Content',
        "Payment processing is handled by Stripe, Inc., a PCI DSS Level 1 certified payment processor. When you provide payment information, it is transmitted directly to Stripe via their secure SDK — we never receive or store your full payment card details.\n\nStripe processes your payment data in accordance with their privacy policy (https://stripe.com/privacy). We receive only: a tokenized payment reference, subscription status, transaction amounts, and billing dates.\n\nFor more information about Stripe's data practices, please visit: https://stripe.com/privacy",
      ),
    },
    {
      id: 'your-rights',
      title: t('marketing.privacy.s8Title', '8. Your Rights (GDPR)'),
      content: t(
        'marketing.privacy.s8Content',
        'Depending on applicable law, you may have rights to access, correct, export, or erase personal data.\n\nThe product currently provides two self-serve tools in Settings:\n\n- Export account data as JSON\n- Permanently delete your account and active application data\n\nDeletion removes active application access and user-owned content from the primary product tables. Limited billing or deletion audit records may still be retained where needed for support, fraud prevention, accounting, or legal obligations.\n\nIf you need help with a correction request or a jurisdiction-specific privacy request, contact privacy@postcommander.com. Requests are reviewed case by case based on the legal obligations that apply to the service operator.',
      ),
    },
    {
      id: 'cookies',
      title: t('marketing.privacy.s9Title', '9. Cookie Policy'),
      content: t(
        'marketing.privacy.s9Content',
        'PostCommander currently relies primarily on essential authentication cookies so signed-in sessions work correctly.\n\nThe interface may also store basic local preferences such as language or display settings in the browser. We do not run advertising cookies in the product experience described here.',
      ),
    },
    {
      id: 'retention',
      title: t('marketing.privacy.s10Title', '10. Data Retention'),
      content: t(
        'marketing.privacy.s10Content',
        'We keep account data for as long as the account is active and needed to provide the service.\n\nIf you delete your account from Settings, active application data tied to that account is removed from the product database. We may retain limited archived billing or deletion audit records that are no longer used for product access but are needed for support, accounting, fraud prevention, or legal obligations. Upstream processors, such as Stripe, may also retain their own records according to their policies.',
      ),
    },
    {
      id: 'international',
      title: t('marketing.privacy.s11Title', '11. International Transfers'),
      content: t(
        'marketing.privacy.s11Content',
        'When you select cloud AI providers or connect third-party social networks, your prompts and content may be processed outside your home jurisdiction.\n\nReview each provider’s terms before enabling it. If you need tighter control, PostCommander also supports local Ollama models so generation can stay on infrastructure you operate.',
      ),
    },
    {
      id: 'children',
      title: t('marketing.privacy.s12Title', "12. Children's Privacy"),
      content: t(
        'marketing.privacy.s12Content',
        'The Service is not directed to individuals under the age of 18. We do not knowingly collect personal data from children under 18. If we become aware that we have collected personal data from a child under 18, we will take steps to delete such data promptly.\n\nIf you are a parent or guardian and believe your child has provided us with personal data, please contact us at privacy@postcommander.com.',
      ),
    },
    {
      id: 'changes',
      title: t('marketing.privacy.s13Title', '13. Changes to This Policy'),
      content: t(
        'marketing.privacy.s13Content',
        'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on the Service and updating the "Last Updated" date. For significant changes, we will also send you an email notification.\n\nWe encourage you to review this Privacy Policy periodically to stay informed about how we protect your data.',
      ),
    },
    {
      id: 'dpo',
      title: t('marketing.privacy.s14Title', '14. Contact DPO'),
      content: t(
        'marketing.privacy.s14Content',
        'If you have questions about this policy or a privacy request, contact:\n\nprivacy@postcommander.com\n\nIf you use a self-hosted deployment, contact the operator of that deployment first because they control the infrastructure and retention settings.',
      ),
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Privacy Page                                                        */
/* ------------------------------------------------------------------ */
export function PrivacyPage() {
  const { t } = useTranslation();
  const sections = usePrivacySections();
  const [activeSection, setActiveSection] = useState('introduction');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY + 200;
    let current = sections[0].id;
    for (const section of sections) {
      const el = sectionRefs.current[section.id];
      if (el && el.offsetTop <= scrollY) {
        current = section.id;
      }
    }
    setActiveSection(current);
  }, [sections]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--color-void)]" />
        <div className="absolute inset-0 mesh-gradient opacity-50" />
        <div className="absolute inset-0 grid-pattern" />

        <div className="orb w-56 h-56 top-[20%] left-[10%] bg-[var(--color-accent-emerald)]/15" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-fade-in-up mb-8">
            <Shield size={14} className="text-[var(--color-accent-emerald)]" />
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide uppercase">
              {t('marketing.privacy.heroBadge', 'Privacy')}
            </span>
          </div>

          <h1 className="heading-lg mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-white">{t('marketing.privacy.heroTitle', 'Privacy Policy')}</span>
          </h1>

          <p
            className="text-sm text-[var(--color-text-muted)] animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            {t('marketing.privacy.lastUpdated', 'Last updated: April 16, 2026')}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 dot-pattern" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-12">
            {/* Sidebar TOC */}
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
                  {t('marketing.privacy.tocTitle', 'Table of Contents')}
                </h3>
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={clsx(
                        'block w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-200',
                        activeSection === section.id
                          ? 'text-white bg-white/[0.06] font-medium'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-white/[0.02]',
                      )}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main content */}
            <div className="lg:col-span-3 space-y-8">
              {sections.map((section, i) => (
                <div
                  key={section.id}
                  ref={(el) => {
                    sectionRefs.current[section.id] = el;
                  }}
                  className="glass-card p-6 sm:p-8 rounded-2xl animate-fade-in-up"
                  style={{ animationDelay: `${0.05 + i * 0.03}s` }}
                >
                  <h2 className="heading-sm text-white mb-4">{section.title}</h2>
                  <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              ))}

              {/* Back to top */}
              <div className="text-center pt-4">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
                >
                  <ArrowUp size={14} />
                  {t('marketing.privacy.backToTop', 'Back to top')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
