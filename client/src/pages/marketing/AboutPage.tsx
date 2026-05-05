import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Sparkles,
  Users,
  Globe,
  Zap,
  Heart,
  Brain,
  Shield,
  Linkedin,
  Twitter,
  Clock,
  BarChart3,
  Target,
  Layers,
  Bot,
  Cpu,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

/* ------------------------------------------------------------------ */
/*  Animated Counter                                                    */
/* ------------------------------------------------------------------ */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref}>
      <span className="heading-xl gradient-text-brand">
        {count.toLocaleString()}
        {suffix}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero Section                                                        */
/* ------------------------------------------------------------------ */
function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[70vh] flex items-center pt-28 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 grid-pattern" />

      <div className="orb w-72 h-72 top-[10%] left-[5%] bg-[var(--color-accent-blue)]/20" />
      <div className="orb w-96 h-96 top-[60%] right-[5%] bg-[var(--color-accent-violet)]/15" style={{ animationDelay: '5s' }} />
      <div className="orb w-56 h-56 top-[30%] right-[30%] bg-[var(--color-accent-magenta)]/10" style={{ animationDelay: '10s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-fade-in-up animate-glow-pulse mb-8">
          <Heart size={14} className="text-[var(--color-accent-magenta)]" />
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide uppercase">
            {t('marketing.about.heroBadge', 'Our Story')}
          </span>
        </div>

        <h1 className="heading-lg mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <span className="text-white block">
            {t('marketing.about.heroTitle1', 'The Story Behind')}
          </span>
          <span className="gradient-text-brand block">
            {t('marketing.about.heroTitle2', 'PostCommander')}
          </span>
        </h1>

        <p
          className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          {t(
            'marketing.about.heroSubtitle',
            'We set out to democratize social media content creation. No more spending hours crafting the perfect post — let AI handle the heavy lifting while you focus on what matters.',
          )}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Mission Section                                                     */
/* ------------------------------------------------------------------ */
function MissionSection() {
  const { t } = useTranslation();

  const pillars = [
    {
      icon: Brain,
      title: t('marketing.about.pillar1Title', 'AI for Everyone'),
      description: t(
        'marketing.about.pillar1Desc',
        'We believe powerful AI content tools should be accessible to every creator, not just those with big budgets or technical expertise.',
      ),
    },
    {
      icon: Target,
      title: t('marketing.about.pillar2Title', 'Quality Over Quantity'),
      description: t(
        'marketing.about.pillar2Desc',
        'Every post should resonate with your audience. Our AI is fine-tuned for engagement, not just output volume.',
      ),
    },
    {
      icon: Globe,
      title: t('marketing.about.pillar3Title', 'Multi-Platform Native'),
      description: t(
        'marketing.about.pillar3Desc',
        'Each platform has its own language. We optimize for LinkedIn, X, Instagram, TikTok, Facebook, and Pinterest natively.',
      ),
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 dot-pattern" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <blockquote className="heading-md gradient-text-cool max-w-3xl mx-auto mb-4 animate-fade-in-up">
            {t(
              'marketing.about.missionQuote',
              '"We believe every creator deserves a voice that reaches millions."',
            )}
          </blockquote>
          <p className="text-sm text-[var(--color-text-muted)] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {t('marketing.about.missionAttribution', '— The PostCommander Team')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((pillar, i) => (
            <div
              key={pillar.title}
              className="glass-card p-8 rounded-2xl hover:scale-[1.02] transition-transform duration-300 animate-fade-in-up"
              style={{ animationDelay: `${0.2 + i * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-accent-blue)] to-[var(--color-accent-violet)] flex items-center justify-center mb-5">
                <pillar.icon size={22} className="text-white" />
              </div>
              <h3 className="heading-sm text-white mb-3">{pillar.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Before/After Section                                                */
/* ------------------------------------------------------------------ */
function BeforeAfterSection() {
  const { t } = useTranslation();

  const beforeItems = [
    { icon: Clock, text: t('marketing.about.before1', '5+ hours per week writing social media posts') },
    { icon: Users, text: t('marketing.about.before2', 'Inconsistent voice across different platforms') },
    { icon: Layers, text: t('marketing.about.before3', 'Managing each platform separately and manually') },
    { icon: BarChart3, text: t('marketing.about.before4', 'Low engagement despite huge time investment') },
    { icon: Target, text: t('marketing.about.before5', 'Guessing what content will resonate') },
  ];

  const afterItems = [
    { icon: Zap, text: t('marketing.about.after1', '15 minutes per week for all your social content') },
    { icon: Shield, text: t('marketing.about.after2', 'Consistent brand voice powered by Style Cloning') },
    { icon: Globe, text: t('marketing.about.after3', '6 platforms optimized simultaneously from one prompt') },
    { icon: BarChart3, text: t('marketing.about.after4', 'AI-predicted engagement scores for every post') },
    { icon: Sparkles, text: t('marketing.about.after5', 'Data-driven content from trending topics and viral patterns') },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="orb w-80 h-80 top-[20%] left-[10%] bg-red-500/10" style={{ animationDelay: '3s' }} />
      <div className="orb w-80 h-80 top-[20%] right-[10%] bg-emerald-500/10" style={{ animationDelay: '8s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="heading-lg text-white mb-4 animate-fade-in-up">
            {t('marketing.about.problemTitle', 'The Problem We Solve')}
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {t(
              'marketing.about.problemSubtitle',
              'See how PostCommander transforms the way creators approach social media.',
            )}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Before */}
          <div
            className="glass-card p-8 rounded-2xl animate-fade-in-up"
            style={{
              animationDelay: '0.2s',
              boxShadow: '0 0 40px rgba(239, 68, 68, 0.08), inset 0 0 40px rgba(239, 68, 68, 0.02)',
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <span className="text-red-400 text-lg font-bold">✕</span>
              </div>
              <h3 className="heading-sm text-red-400">
                {t('marketing.about.beforeLabel', 'Before PostCommander')}
              </h3>
            </div>
            <div className="space-y-4">
              {beforeItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <item.icon size={18} className="text-red-400/60 shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* After */}
          <div
            className="glass-card p-8 rounded-2xl animate-fade-in-up"
            style={{
              animationDelay: '0.3s',
              boxShadow: '0 0 40px rgba(16, 185, 129, 0.08), inset 0 0 40px rgba(16, 185, 129, 0.02)',
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <span className="text-emerald-400 text-lg font-bold">✓</span>
              </div>
              <h3 className="heading-sm text-emerald-400">
                {t('marketing.about.afterLabel', 'After PostCommander')}
              </h3>
            </div>
            <div className="space-y-4">
              {afterItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <item.icon size={18} className="text-emerald-400/60 shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {item.text}
                  </p>
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
/*  Team Section                                                        */
/* ------------------------------------------------------------------ */
function TeamSection() {
  const { t } = useTranslation();

  const team = [
    {
      initials: 'SL',
      name: t('marketing.about.team1Name', 'Sophie Laurent'),
      role: t('marketing.about.team1Role', 'CEO & Founder'),
      bio: t(
        'marketing.about.team1Bio',
        'Former Head of Content at a Fortune 500. Passionate about making AI tools accessible to every creator. Built PostCommander after years of watching teams struggle with multi-platform content.',
      ),
      gradient: 'from-[var(--color-accent-blue)] to-[var(--color-accent-violet)]',
      linkedin: '#',
      twitter: '#',
    },
    {
      initials: 'MR',
      name: t('marketing.about.team2Name', 'Marc Rousseau'),
      role: t('marketing.about.team2Role', 'CTO'),
      bio: t(
        'marketing.about.team2Bio',
        'Ex-Google engineer with a decade of experience in distributed systems and ML. Architected the multi-AI orchestration engine that powers PostCommander.',
      ),
      gradient: 'from-[var(--color-accent-violet)] to-[var(--color-accent-magenta)]',
      linkedin: '#',
      twitter: '#',
    },
    {
      initials: 'AK',
      name: t('marketing.about.team3Name', 'Aisha Khan'),
      role: t('marketing.about.team3Role', 'Head of AI'),
      bio: t(
        'marketing.about.team3Bio',
        'PhD in NLP from MIT. Previously led the conversational AI team at a top social platform. Pioneered our multi-model content generation and style cloning system.',
      ),
      gradient: 'from-[var(--color-accent-magenta)] to-[var(--color-accent-cyan)]',
      linkedin: '#',
      twitter: '#',
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 dot-pattern" />
      <div className="orb w-64 h-64 top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-[var(--color-accent-violet)]/10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="heading-lg text-white mb-4 animate-fade-in-up">
            {t('marketing.about.teamTitle', 'Built by Creators, for Creators')}
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {t(
              'marketing.about.teamSubtitle',
              'A team of engineers, creators, and AI researchers united by one mission: making content creation effortless.',
            )}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {team.map((member, i) => (
            <div
              key={member.name}
              className="glass-card p-8 rounded-2xl text-center hover:scale-[1.02] transition-transform duration-300 animate-fade-in-up"
              style={{ animationDelay: `${0.2 + i * 0.1}s` }}
            >
              <div
                className={clsx(
                  'w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center bg-gradient-to-br',
                  member.gradient,
                )}
              >
                <span className="font-display text-2xl font-bold text-white">{member.initials}</span>
              </div>
              <h3 className="heading-sm text-white mb-1">{member.name}</h3>
              <p className="text-sm text-[var(--color-accent-violet)] font-medium mb-4">{member.role}</p>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-5">
                {member.bio}
              </p>
              <div className="flex items-center justify-center gap-3">
                <a
                  href={member.linkedin}
                  className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-white/[0.04] transition-all"
                  aria-label={`${member.name} LinkedIn`}
                >
                  <Linkedin size={16} />
                </a>
                <a
                  href={member.twitter}
                  className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-white/[0.04] transition-all"
                  aria-label={`${member.name} Twitter`}
                >
                  <Twitter size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Numbers / Stats Section                                             */
/* ------------------------------------------------------------------ */
function StatsSection() {
  const { t } = useTranslation();

  const stats = [
    { target: 10000, suffix: '+', label: t('marketing.about.stat1', 'Posts Generated') },
    { target: 2500, suffix: '+', label: t('marketing.about.stat2', 'Creators') },
    { target: 6, suffix: '', label: t('marketing.about.stat3', 'Platforms') },
    { target: 5, suffix: '', label: t('marketing.about.stat4', 'AI Models') },
    { target: 8, suffix: '', label: t('marketing.about.stat5', 'Languages') },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute inset-0 mesh-gradient opacity-50" />
      <div className="orb w-96 h-96 top-[30%] left-[10%] bg-[var(--color-accent-blue)]/15" style={{ animationDelay: '2s' }} />
      <div className="orb w-72 h-72 top-[40%] right-[15%] bg-[var(--color-accent-magenta)]/10" style={{ animationDelay: '7s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="heading-lg text-white mb-4 animate-fade-in-up">
            {t('marketing.about.statsTitle', 'PostCommander in Numbers')}
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {t(
              'marketing.about.statsSubtitle',
              'Growing every day, powering creators worldwide.',
            )}
          </p>
        </div>

        <div className="glass-card p-8 sm:p-12 rounded-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="text-center animate-fade-in-up"
                style={{ animationDelay: `${0.2 + i * 0.1}s` }}
              >
                <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                <p className="text-sm text-[var(--color-text-secondary)] mt-2 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Technology Stack Section                                            */
/* ------------------------------------------------------------------ */
function TechSection() {
  const { t } = useTranslation();

  const providers = [
    {
      name: 'OpenAI',
      icon: Bot,
      color: 'from-emerald-500 to-emerald-600',
      strengths: t(
        'marketing.about.openaiStrengths',
        'Exceptional at creative writing, versatile tone control, and producing polished marketing copy that converts.',
      ),
    },
    {
      name: 'Claude (Anthropic)',
      icon: Brain,
      color: 'from-orange-500 to-amber-500',
      strengths: t(
        'marketing.about.claudeStrengths',
        'Superior long-form reasoning, nuanced understanding of context, and thoughtful content that builds trust.',
      ),
    },
    {
      name: 'Gemini (Google)',
      icon: Sparkles,
      color: 'from-blue-500 to-cyan-500',
      strengths: t(
        'marketing.about.geminiStrengths',
        'Multimodal understanding, real-time knowledge integration, and strong multi-language capabilities.',
      ),
    },
    {
      name: 'Mistral',
      icon: Zap,
      color: 'from-violet-500 to-purple-500',
      strengths: t(
        'marketing.about.mistralStrengths',
        'Fast inference, excellent European language support, and cost-effective high-quality generation.',
      ),
    },
    {
      name: 'Ollama (Local)',
      icon: Cpu,
      color: 'from-gray-400 to-gray-500',
      strengths: t(
        'marketing.about.ollamaStrengths',
        'Complete data privacy with local inference, no API costs, and full offline capability for sensitive content.',
      ),
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 dot-pattern" />
      <div className="orb w-64 h-64 bottom-[20%] right-[10%] bg-[var(--color-accent-cyan)]/10" style={{ animationDelay: '4s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="heading-lg text-white mb-4 animate-fade-in-up">
            {t('marketing.about.techTitle', 'Powered by 5 AI Models')}
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {t(
              'marketing.about.techSubtitle',
              'We use a multi-AI approach so you always get the best output. Different models excel at different tasks — PostCommander picks the right one for you.',
            )}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider, i) => (
            <div
              key={provider.name}
              className={clsx(
                'glass-card p-6 rounded-2xl hover:scale-[1.02] transition-transform duration-300 animate-fade-in-up',
                i === 4 && 'sm:col-span-2 lg:col-span-1',
              )}
              style={{ animationDelay: `${0.2 + i * 0.1}s` }}
            >
              <div
                className={clsx(
                  'w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-gradient-to-br',
                  provider.color,
                )}
              >
                <provider.icon size={20} className="text-white" />
              </div>
              <h3 className="heading-sm text-white mb-2">{provider.name}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {provider.strengths}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA Section                                                         */
/* ------------------------------------------------------------------ */
function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute inset-0 mesh-gradient opacity-40" />
      <div className="orb w-72 h-72 top-[30%] left-[20%] bg-[var(--color-accent-violet)]/15" style={{ animationDelay: '3s' }} />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="heading-lg text-white mb-6 animate-fade-in-up">
          {t('marketing.about.ctaTitle', 'Join the Community')}
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {t(
            'marketing.about.ctaSubtitle',
            'Thousands of creators are already using PostCommander to grow their social media presence. Ready to join them?',
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Link to="/app" className="btn-primary-glow">
            {t('marketing.about.ctaPrimary', 'Start Free')}
            <ArrowRight size={18} />
          </Link>
          <Link to="/blog" className="btn-ghost-glow">
            {t('marketing.about.ctaSecondary', 'Read Our Blog')}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  About Page                                                          */
/* ------------------------------------------------------------------ */
export function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <HeroSection />
      <MissionSection />
      <BeforeAfterSection />
      <TeamSection />
      <StatsSection />
      <TechSection />
      <CTASection />
    </>
  );
}
