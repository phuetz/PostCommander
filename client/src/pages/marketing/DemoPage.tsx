import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Play,
  Sparkles,
  Users,
  Lightbulb,
  Link2,
  TrendingUp,
  Bot,
  Cpu,
  Zap,
  Hash,
  BarChart3,
  Target,
  CheckCircle2,
  Clock,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Globe,
  Bookmark,
  Flame,
  LayoutGrid,
  FileText,
  Palette,
  ImagePlus,
} from 'lucide-react';
import clsx from 'clsx';

/* ------------------------------------------------------------------ */
/*  Typing Effect                                                       */
/* ------------------------------------------------------------------ */
function TypingEffect({ text, speed = 40 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, done, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="animate-pulse text-[var(--color-accent-violet)]">|</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Step Indicator                                                      */
/* ------------------------------------------------------------------ */
function StepNumber({ num }: { num: string }) {
  return (
    <div className="hidden lg:block absolute -left-20 top-0">
      <span className="font-display text-7xl font-extrabold gradient-text-brand opacity-30 select-none">
        {num}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Platform Pill                                                       */
/* ------------------------------------------------------------------ */
function PlatformPill({ name, active, color }: { name: string; active: boolean; color: string }) {
  return (
    <span
      className={clsx(
        'px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border',
        active
          ? 'border-transparent text-white'
          : 'border-white/[0.06] text-[var(--color-text-muted)] bg-white/[0.02]',
      )}
      style={active ? { background: color, boxShadow: `0 0 20px ${color}40` } : {}}
    >
      {name}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero Section                                                        */
/* ------------------------------------------------------------------ */
function HeroSection() {
  const { t } = useTranslation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const target = 2500;
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[80vh] flex items-center pt-24 lg:pt-32 pb-20 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 grid-pattern" />

      {/* Floating orbs */}
      <div className="orb w-72 h-72 top-[10%] left-[5%] bg-[var(--color-accent-blue)]/20" />
      <div
        className="orb w-96 h-96 bottom-[10%] right-[5%] bg-[var(--color-accent-violet)]/15"
        style={{ animationDelay: '7s' }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-fade-in-up animate-glow-pulse mb-8">
          <Play size={14} className="text-[var(--color-accent-violet)]" />
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide uppercase">
            {t('marketing.demo.badge', 'Interactive Product Tour')}
          </span>
        </div>

        {/* Heading */}
        <h1 className="heading-lg mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <span className="text-white block">
            {t('marketing.demo.titleLine1', 'See PostCommander')}
          </span>
          <span
            className="gradient-text-brand animate-shimmer block"
            style={{ backgroundSize: '200% auto' }}
          >
            {t('marketing.demo.titleLine2', 'in Action')}
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          {t(
            'marketing.demo.subtitle',
            'A guided walkthrough of every feature \u2014 no signup required',
          )}
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          <Link to="/app" className="btn-primary-glow">
            {t('marketing.demo.ctaPrimary', 'Start Free Trial')}
            <ArrowRight size={18} />
          </Link>
          <a href="#step-1" className="btn-ghost-glow">
            <Play size={16} />
            {t('marketing.demo.ctaSecondary', 'Watch Video')}
          </a>
        </div>

        {/* Animated counter */}
        <div
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          <Users size={16} className="text-[var(--color-accent-emerald)]" />
          <span>
            {t('marketing.demo.counterPrefix', 'Join')} {count.toLocaleString()}+{' '}
            {t('marketing.demo.counterSuffix', 'creators already using PostCommander')}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1: Enter Your Idea                                             */
/* ------------------------------------------------------------------ */
function Step1() {
  const { t } = useTranslation();

  const inputMethods = [
    {
      icon: Lightbulb,
      title: t('marketing.demo.step1.method1Title', 'From scratch'),
      desc: t('marketing.demo.step1.method1Desc', 'Describe any topic or idea'),
    },
    {
      icon: Link2,
      title: t('marketing.demo.step1.method2Title', 'From URL'),
      desc: t('marketing.demo.step1.method2Desc', 'Paste an article or blog link'),
    },
    {
      icon: TrendingUp,
      title: t('marketing.demo.step1.method3Title', 'From trends'),
      desc: t('marketing.demo.step1.method3Desc', 'Let AI suggest trending topics'),
    },
  ];

  return (
    <section id="step-1" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — Mockup */}
          <div className="relative animate-fade-in-up">
            <StepNumber num="01" />

            {/* Glow behind card */}
            <div className="absolute -inset-4 bg-gradient-to-br from-[var(--color-accent-blue)]/10 via-transparent to-[var(--color-accent-violet)]/5 rounded-3xl blur-2xl" />

            <div className="relative glass-card rounded-2xl overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-white/[0.04] text-[10px] text-[var(--color-text-muted)]">
                    PostCommander
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Label */}
                <div className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  {t('marketing.demo.step1.inputLabel', 'What do you want to write about?')}
                </div>

                {/* Textarea mockup */}
                <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-[var(--color-text-primary)] min-h-[60px]">
                  <TypingEffect
                    text={t(
                      'marketing.demo.step1.typingText',
                      '5 productivity tips for remote teams...',
                    )}
                  />
                </div>

                {/* Platform pills */}
                <div className="space-y-2">
                  <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    {t('marketing.demo.step1.platformsLabel', 'Platforms')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <PlatformPill name="LinkedIn" active color="#0A66C2" />
                    <PlatformPill name="X" active color="#1DA1F2" />
                    <PlatformPill name="Instagram" active color="#E4405F" />
                    <PlatformPill name="Facebook" active={false} color="#1877F2" />
                    <PlatformPill name="TikTok" active={false} color="#ff0050" />
                    <PlatformPill name="Pinterest" active={false} color="#E60023" />
                  </div>
                </div>

                {/* Tone selector */}
                <div className="space-y-2">
                  <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    {t('marketing.demo.step1.toneLabel', 'Tone')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Casual', 'Professional', 'Witty', 'Inspiring'].map((tone) => (
                      <span
                        key={tone}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          tone === 'Professional'
                            ? 'bg-[var(--color-accent-violet)]/20 text-[var(--color-accent-violet)] border border-[var(--color-accent-violet)]/30'
                            : 'bg-white/[0.03] text-[var(--color-text-muted)] border border-white/[0.06]',
                        )}
                      >
                        {tone}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Description */}
          <div className="animate-fade-in-up delay-200">
            <h2 className="heading-md text-white mb-4">
              {t('marketing.demo.step1.heading', 'Start with Any Idea')}
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed">
              {t(
                'marketing.demo.step1.description',
                'Paste a URL, describe a topic, or let AI suggest trending ideas in your niche. PostCommander transforms any starting point into platform-optimized content.',
              )}
            </p>

            <div className="grid gap-3">
              {inputMethods.map((method) => (
                <div
                  key={method.title}
                  className="glass-card rounded-xl p-4 flex items-start gap-4 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--color-accent-blue)]/10 flex items-center justify-center">
                    <method.icon size={18} className="text-[var(--color-accent-blue)]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white mb-0.5">{method.title}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{method.desc}</div>
                  </div>
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
/*  Step 2: Choose Your AI                                              */
/* ------------------------------------------------------------------ */
function Step2() {
  const { t } = useTranslation();

  const providers = [
    {
      name: 'OpenAI',
      model: 'GPT-4o',
      badge: t('marketing.demo.step2.badgeCreative', 'Creative'),
      color: 'var(--color-accent-emerald)',
      selected: false,
    },
    {
      name: 'Claude',
      model: 'Claude 3.5 Sonnet',
      badge: t('marketing.demo.step2.badgeNuanced', 'Nuanced'),
      color: 'var(--color-accent-violet)',
      selected: true,
    },
    {
      name: 'Gemini',
      model: 'Gemini Pro',
      badge: t('marketing.demo.step2.badgeFast', 'Fast'),
      color: 'var(--color-accent-blue)',
      selected: false,
    },
    {
      name: 'Mistral',
      model: 'Mistral Large',
      badge: t('marketing.demo.step2.badgePrecise', 'Precise'),
      color: 'var(--color-accent-cyan)',
      selected: false,
    },
    {
      name: 'Ollama',
      model: 'Llama 3',
      badge: t('marketing.demo.step2.badgePrivate', 'Private'),
      color: 'var(--color-accent-magenta)',
      selected: false,
    },
  ];

  const comparisons = [
    {
      model: 'GPT-4o',
      strength: t('marketing.demo.step2.strengthCreative', 'Creative & versatile'),
    },
    { model: 'Claude', strength: t('marketing.demo.step2.strengthNuanced', 'Nuanced & detailed') },
    { model: 'Gemini', strength: t('marketing.demo.step2.strengthFast', 'Fast & efficient') },
    { model: 'Mistral', strength: t('marketing.demo.step2.strengthPrecise', 'Precise & focused') },
    { model: 'Ollama', strength: t('marketing.demo.step2.strengthLocal', 'Local & private') },
  ];

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — Description */}
          <div className="order-2 lg:order-1 animate-fade-in-up">
            <h2 className="heading-md text-white mb-4">
              {t('marketing.demo.step2.heading', '5 AI Models, One Interface')}
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed">
              {t(
                'marketing.demo.step2.description',
                'Different AI models have different strengths. PostCommander gives you access to all five leading models so you can compare outputs and pick the best result every time.',
              )}
            </p>

            <div className="space-y-2">
              {comparisons.map((c) => (
                <div
                  key={c.model}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <Bot size={14} className="text-[var(--color-accent-violet)] flex-shrink-0" />
                  <span className="text-sm font-semibold text-white w-20">{c.model}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{c.strength}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Mockup */}
          <div className="relative order-1 lg:order-2 animate-fade-in-up delay-200">
            <StepNumber num="02" />

            <div className="absolute -inset-4 bg-gradient-to-bl from-[var(--color-accent-violet)]/10 via-transparent to-[var(--color-accent-blue)]/5 rounded-3xl blur-2xl" />

            <div className="relative glass-card rounded-2xl overflow-hidden p-6">
              <div className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
                {t('marketing.demo.step2.selectLabel', 'Choose your AI provider')}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {providers.map((p) => (
                  <div
                    key={p.name}
                    className={clsx(
                      'relative rounded-xl p-4 border transition-all cursor-default',
                      p.selected
                        ? 'border-[var(--color-accent-violet)]/40 bg-[var(--color-accent-violet)]/[0.08] glow-border'
                        : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]',
                    )}
                  >
                    {p.selected && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[var(--color-accent-violet)] flex items-center justify-center">
                        <CheckCircle2 size={12} className="text-white" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu size={14} style={{ color: p.color }} />
                      <span className="text-sm font-semibold text-white">{p.name}</span>
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)] mb-2">{p.model}</div>
                    <span
                      className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-semibold"
                      style={{
                        background: `color-mix(in srgb, ${p.color} 15%, transparent)`,
                        color: p.color,
                      }}
                    >
                      {p.badge}
                    </span>
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
/*  Step 3: Generate & Preview                                          */
/* ------------------------------------------------------------------ */
function Step3() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  const platforms = [
    { name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
    { name: 'X', icon: Twitter, color: '#1DA1F2' },
    { name: 'Instagram', icon: Instagram, color: '#E4405F' },
  ];

  const features = [
    {
      icon: Target,
      title: t('marketing.demo.step3.feature1Title', 'Platform-Specific'),
      desc: t(
        'marketing.demo.step3.feature1Desc',
        'Each platform gets optimized content tailored to its audience and format',
      ),
    },
    {
      icon: Zap,
      title: t('marketing.demo.step3.feature2Title', 'Real-Time Streaming'),
      desc: t(
        'marketing.demo.step3.feature2Desc',
        'Watch the AI write in real-time with live token streaming',
      ),
    },
    {
      icon: Hash,
      title: t('marketing.demo.step3.feature3Title', 'Smart Hashtags'),
      desc: t(
        'marketing.demo.step3.feature3Desc',
        'Auto-generated relevant hashtags based on content analysis',
      ),
    },
  ];

  const samplePost = t(
    'marketing.demo.step3.samplePost',
    "Remote work is here to stay. But are you truly productive, or just busy?\n\nAfter managing distributed teams for 5 years, here are the 5 habits that separate high performers from the rest:\n\n1. Time-blocking deep work sessions\n2. Async-first communication\n3. Weekly energy audits\n4. Environment design for focus\n5. Intentional disconnect rituals\n\nThe best remote workers don't work more. They work with intention.\n\nWhat's your top remote productivity tip? Share below.",
  );

  const hashtags = ['#RemoteWork', '#Productivity', '#WFH', '#Leadership', '#FutureOfWork'];

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative animate-fade-in-up">
          <StepNumber num="03" />

          {/* Glow */}
          <div className="absolute -inset-8 bg-gradient-to-r from-[var(--color-accent-blue)]/8 via-[var(--color-accent-violet)]/5 to-[var(--color-accent-magenta)]/8 rounded-3xl blur-3xl" />

          {/* Main mockup */}
          <div className="relative glass-card rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--color-accent-violet)]" />
                <span className="text-sm font-semibold text-white">
                  {t('marketing.demo.step3.generatedTitle', 'Generated Content')}
                </span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-accent-emerald)]/10 text-[var(--color-accent-emerald)] text-[10px] font-semibold">
                <Sparkles size={10} />
                {t('marketing.demo.step3.aiTag', 'AI Generated')}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/[0.06]">
              {platforms.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => setActiveTab(i)}
                  className={clsx(
                    'flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2',
                    i === activeTab
                      ? 'text-white border-[var(--color-accent-violet)]'
                      : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text-secondary)]',
                  )}
                >
                  <p.icon size={14} />
                  {p.name}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="relative">
                {/* Shimmer overlay */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-shimmer rounded-xl pointer-events-none"
                  style={{ backgroundSize: '200% 100%' }}
                />

                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                  {samplePost}
                </div>
              </div>

              {/* Character count */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {t('marketing.demo.step3.charCount', '1,847 / 3,000 characters')}
                  </span>
                </div>
                <div className="w-32 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent-emerald)]"
                    style={{ width: '62%' }}
                  />
                </div>
              </div>

              {/* Hashtags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] border border-[var(--color-accent-blue)]/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature callouts */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={clsx(
                'glass-card rounded-xl p-5 animate-fade-in-up',
                i === 0 && 'delay-100',
                i === 1 && 'delay-200',
                i === 2 && 'delay-300',
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-violet)]/10 flex items-center justify-center mb-3">
                <f.icon size={18} className="text-[var(--color-accent-violet)]" />
              </div>
              <div className="text-sm font-semibold text-white mb-1">{f.title}</div>
              <div className="text-xs text-[var(--color-text-muted)] leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 4: Refine & Optimize                                           */
/* ------------------------------------------------------------------ */
function Step4() {
  const { t } = useTranslation();

  const metrics = [
    {
      label: t('marketing.demo.step4.metricHook', 'Hook Strength'),
      value: 92,
      color: 'var(--color-accent-emerald)',
    },
    {
      label: t('marketing.demo.step4.metricReadability', 'Readability'),
      value: 88,
      color: 'var(--color-accent-blue)',
    },
    {
      label: t('marketing.demo.step4.metricEngagement', 'Engagement Potential'),
      value: 85,
      color: 'var(--color-accent-violet)',
    },
    {
      label: t('marketing.demo.step4.metricClarity', 'Clarity'),
      value: 90,
      color: 'var(--color-accent-cyan)',
    },
    {
      label: t('marketing.demo.step4.metricEmotion', 'Emotional Appeal'),
      value: 78,
      color: 'var(--color-accent-magenta)',
    },
    {
      label: t('marketing.demo.step4.metricCTA', 'Call-to-Action'),
      value: 82,
      color: 'var(--color-accent-blue)',
    },
  ];

  const suggestions = [
    t(
      'marketing.demo.step4.suggestion1',
      'Add a personal anecdote in the opening to boost relatability',
    ),
    t('marketing.demo.step4.suggestion2', 'Consider breaking point 3 into a more actionable tip'),
    t(
      'marketing.demo.step4.suggestion3',
      'Ending question is strong \u2014 consider adding two options to increase replies',
    ),
  ];

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — Mockup */}
          <div className="relative animate-fade-in-up">
            <StepNumber num="04" />

            <div className="absolute -inset-4 bg-gradient-to-br from-[var(--color-accent-emerald)]/8 via-transparent to-[var(--color-accent-violet)]/5 rounded-3xl blur-2xl" />

            <div className="relative glass-card rounded-2xl overflow-hidden p-6">
              {/* Score ring */}
              <div className="flex items-center gap-8 mb-8">
                <div className="relative w-28 h-28 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="url(#scoreGrad)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${87 * 2.64} ${100 * 2.64}`}
                    />
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="var(--color-accent-blue)" />
                        <stop offset="100%" stopColor="var(--color-accent-violet)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-2xl font-bold text-white">87</span>
                    <span className="text-[9px] text-[var(--color-text-muted)]">/100</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white mb-1">
                    {t('marketing.demo.step4.scoreLabel', 'Engagement Score')}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {t(
                      'marketing.demo.step4.scoreDesc',
                      'Above average for LinkedIn posts in this category',
                    )}
                  </div>
                </div>
              </div>

              {/* Metric bars */}
              <div className="space-y-3">
                {metrics.map((m) => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-[var(--color-text-secondary)]">
                        {m.label}
                      </span>
                      <span className="text-[11px] font-semibold text-white">{m.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${m.value}%`, background: m.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              <div className="mt-6 space-y-2">
                <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                  {t('marketing.demo.step4.suggestionsLabel', 'Improvement Suggestions')}
                </div>
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                  >
                    <Sparkles
                      size={12}
                      className="text-[var(--color-accent-violet)] flex-shrink-0 mt-0.5"
                    />
                    <span className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Description */}
          <div className="animate-fade-in-up delay-200">
            <h2 className="heading-md text-white mb-4">
              {t('marketing.demo.step4.heading', 'AI-Powered Optimization')}
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed">
              {t(
                'marketing.demo.step4.description',
                'Every piece of content gets scored on engagement potential. Our AI analyzes hook strength, readability, emotional appeal, and more \u2014 then gives you actionable suggestions to improve.',
              )}
            </p>

            {/* Before/After mini comparison */}
            <div className="glass-card rounded-xl p-5">
              <div className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
                {t('marketing.demo.step4.beforeAfter', 'Before / After Optimization')}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="var(--color-accent-magenta)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${64 * 2.64} ${100 * 2.64}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-display text-base font-bold text-white">64</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {t('marketing.demo.step4.before', 'Before')}
                  </span>
                </div>
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="var(--color-accent-emerald)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${87 * 2.64} ${100 * 2.64}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-display text-base font-bold text-white">87</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {t('marketing.demo.step4.after', 'After')}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-3 text-[var(--color-accent-emerald)]">
                <TrendingUp size={14} />
                <span className="text-xs font-semibold">
                  +36% {t('marketing.demo.step4.improvement', 'improvement')}
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
/*  Step 5: Publish Everywhere                                          */
/* ------------------------------------------------------------------ */
function Step5() {
  const { t } = useTranslation();

  const platformCards = [
    { name: 'LinkedIn', icon: Linkedin, color: '#0A66C2', status: 'published' as const },
    { name: 'X / Twitter', icon: Twitter, color: '#1DA1F2', status: 'published' as const },
    { name: 'Instagram', icon: Instagram, color: '#E4405F', status: 'published' as const },
    { name: 'Facebook', icon: Facebook, color: '#1877F2', status: 'published' as const },
    { name: 'TikTok', icon: Globe, color: '#ff0050', status: 'scheduled' as const },
    { name: 'Pinterest', icon: Bookmark, color: '#E60023', status: 'published' as const },
  ];

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative animate-fade-in-up">
          <StepNumber num="05" />

          {/* Platform cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {platformCards.map((p, i) => (
              <div
                key={p.name}
                className={clsx(
                  'glass-card rounded-xl p-5 text-center animate-fade-in-up transition-all hover:bg-white/[0.05]',
                  i === 0 && 'delay-100',
                  i === 1 && 'delay-200',
                  i === 2 && 'delay-300',
                  i === 3 && 'delay-400',
                  i === 4 && 'delay-500',
                  i === 5 && 'delay-600',
                )}
              >
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: `${p.color}20` }}
                >
                  <p.icon size={22} style={{ color: p.color }} />
                </div>
                <div className="text-xs font-semibold text-white mb-2">{p.name}</div>
                {p.status === 'published' ? (
                  <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-[var(--color-accent-emerald)]">
                    <CheckCircle2 size={12} />
                    {t('marketing.demo.step5.published', 'Published')}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-[var(--color-accent-blue)]">
                    <Clock size={12} />
                    {t('marketing.demo.step5.scheduled', 'Scheduled 3pm')}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="heading-md text-white mb-4">
              {t('marketing.demo.step5.heading', 'One Click, Six Platforms')}
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              {t(
                'marketing.demo.step5.description',
                'Publish instantly or schedule for the perfect time. PostCommander handles platform-specific formatting, character limits, and media requirements automatically. View everything in a beautiful calendar view.',
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Tools Showcase                                                      */
/* ------------------------------------------------------------------ */
function ToolsShowcase() {
  const { t } = useTranslation();

  const tools = [
    {
      icon: Flame,
      title: t('marketing.demo.tools.viralTitle', 'Viral Library'),
      desc: t('marketing.demo.tools.viralDesc', 'Browse thousands of viral posts for inspiration'),
      color: 'var(--color-accent-magenta)',
      mockup: (
        <div className="space-y-2 mt-3">
          {[85, 72, 91].map((score, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]"
            >
              <div className="w-8 h-8 rounded bg-white/[0.06] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-1.5 bg-white/[0.08] rounded-full w-full mb-1" />
                <div className="h-1.5 bg-white/[0.06] rounded-full w-2/3" />
              </div>
              <span className="text-[9px] font-bold text-[var(--color-accent-emerald)]">
                {score}%
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Zap,
      title: t('marketing.demo.tools.hookTitle', 'Hook Generator'),
      desc: t('marketing.demo.tools.hookDesc', 'Generate attention-grabbing opening lines'),
      color: 'var(--color-accent-blue)',
      mockup: (
        <div className="space-y-2 mt-3">
          {[
            'Stop scrolling. This will change how you...',
            "I spent 10 years learning what I'm about...",
            'The biggest mistake I see in remote...',
          ].map((hook, i) => (
            <div
              key={i}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.04] text-[9px] text-[var(--color-text-muted)] truncate"
            >
              {hook}
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: LayoutGrid,
      title: t('marketing.demo.tools.carouselTitle', 'Carousel Creator'),
      desc: t('marketing.demo.tools.carouselDesc', 'Design multi-slide visual content'),
      color: 'var(--color-accent-violet)',
      mockup: (
        <div className="flex gap-1.5 mt-3 overflow-hidden">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="w-12 h-16 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0"
            >
              <span className="text-[9px] font-bold text-[var(--color-text-muted)]">{n}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: FileText,
      title: t('marketing.demo.tools.templateTitle', 'Template Library'),
      desc: t('marketing.demo.tools.templateDesc', 'Start from proven content templates'),
      color: 'var(--color-accent-cyan)',
      mockup: (
        <div className="grid grid-cols-2 gap-1.5 mt-3">
          {['Story', 'List', 'How-to', 'Opinion'].map((tpl) => (
            <div
              key={tpl}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.04] text-center"
            >
              <span className="text-[9px] font-medium text-[var(--color-text-muted)]">{tpl}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Palette,
      title: t('marketing.demo.tools.styleTitle', 'Style Cloning'),
      desc: t('marketing.demo.tools.styleDesc', "Clone any creator's writing style"),
      color: 'var(--color-accent-emerald)',
      mockup: (
        <div className="mt-3 flex items-center justify-center">
          <svg width="80" height="80" viewBox="0 0 100 100" className="opacity-60">
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const r = [35, 28, 40, 32, 25, 38][i];
              const x = 50 + r * Math.cos((angle * Math.PI) / 180);
              const y = 50 + r * Math.sin((angle * Math.PI) / 180);
              return (
                <line
                  key={angle}
                  x1="50"
                  y1="50"
                  x2={x}
                  y2={y}
                  stroke="var(--color-accent-emerald)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              );
            })}
            <polygon
              points={[0, 60, 120, 180, 240, 300]
                .map((angle, i) => {
                  const r = [35, 28, 40, 32, 25, 38][i];
                  const x = 50 + r * Math.cos((angle * Math.PI) / 180);
                  const y = 50 + r * Math.sin((angle * Math.PI) / 180);
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="var(--color-accent-emerald)"
              fillOpacity="0.1"
              stroke="var(--color-accent-emerald)"
              strokeWidth="1.5"
              strokeOpacity="0.4"
            />
          </svg>
        </div>
      ),
    },
    {
      icon: ImagePlus,
      title: t('marketing.demo.tools.imagesTitle', 'AI Images'),
      desc: t('marketing.demo.tools.imagesDesc', 'Generate matching visuals for your content'),
      color: 'var(--color-accent-magenta)',
      mockup: (
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="aspect-square rounded-lg overflow-hidden"
              style={{
                background: `linear-gradient(${n * 45}deg, var(--color-accent-violet)/10, var(--color-accent-magenta)/10)`,
              }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <ImagePlus size={14} className="text-[var(--color-text-muted)] opacity-40" />
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('marketing.demo.tools.heading', 'A Complete Content Arsenal')}
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto animate-fade-in-up delay-100">
            {t(
              'marketing.demo.tools.subtitle',
              'Beyond post generation \u2014 PostCommander gives you every tool you need to dominate social media.',
            )}
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool, i) => (
            <div
              key={tool.title}
              className={clsx(
                'glass-card rounded-xl p-5 hover:bg-white/[0.05] transition-all group animate-fade-in-up',
                i === 0 && 'delay-100',
                i === 1 && 'delay-200',
                i === 2 && 'delay-300',
                i === 3 && 'delay-400',
                i === 4 && 'delay-500',
                i === 5 && 'delay-600',
              )}
            >
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `color-mix(in srgb, ${tool.color} 15%, transparent)` }}
                >
                  <tool.icon size={16} style={{ color: tool.color }} />
                </div>
                <div className="text-sm font-semibold text-white">{tool.title}</div>
              </div>
              <div className="text-[11px] text-[var(--color-text-muted)] mb-1 ml-12">
                {tool.desc}
              </div>
              <div className="ml-0">{tool.mockup}</div>
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
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 mesh-gradient opacity-60" />
      <div className="orb w-80 h-80 top-[20%] left-[10%] bg-[var(--color-accent-blue)]/15" />
      <div
        className="orb w-64 h-64 bottom-[10%] right-[15%] bg-[var(--color-accent-violet)]/12"
        style={{ animationDelay: '8s' }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="heading-lg text-white mb-8 animate-fade-in-up">
          {t('marketing.demo.cta.heading', 'Ready to Transform Your Content?')}
        </h2>

        {/* Stats */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-10 animate-fade-in-up delay-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-emerald)]/10 flex items-center justify-center">
              <Clock size={20} className="text-[var(--color-accent-emerald)]" />
            </div>
            <div className="text-left">
              <div className="font-display text-xl font-bold text-white">
                {t('marketing.demo.cta.stat1Value', '10+ hours/week')}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {t('marketing.demo.cta.stat1Label', 'Time saved on content')}
              </div>
            </div>
          </div>

          <div className="hidden sm:block w-px h-12 bg-white/[0.06]" />

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-violet)]/10 flex items-center justify-center">
              <BarChart3 size={20} className="text-[var(--color-accent-violet)]" />
            </div>
            <div className="text-left">
              <div className="font-display text-xl font-bold text-white">
                {t('marketing.demo.cta.stat2Value', '3x More Engagement')}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {t('marketing.demo.cta.stat2Label', 'Average improvement')}
              </div>
            </div>
          </div>
        </div>

        {/* CTA button */}
        <div className="animate-fade-in-up delay-200">
          <Link to="/app" className="btn-primary-glow text-lg">
            {t('marketing.demo.cta.button', 'Start Free \u2014 No Card Required')}
            <ArrowRight size={20} />
          </Link>
          <p className="text-sm text-[var(--color-text-muted)] mt-4">
            {t('marketing.demo.cta.fine', 'Free plan includes 10 posts/month')}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress Line (desktop)                                             */
/* ------------------------------------------------------------------ */
function ProgressLine() {
  return (
    <div
      className="hidden lg:block fixed left-[calc(50vw-37rem)] top-0 bottom-0 w-px z-10 pointer-events-none"
      style={{
        background:
          'linear-gradient(180deg, transparent 15%, var(--color-accent-blue) 30%, var(--color-accent-violet) 60%, var(--color-accent-magenta) 80%, transparent 95%)',
        opacity: 0.15,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Export                                                              */
/* ------------------------------------------------------------------ */
export function DemoPage() {
  return (
    <>
      <ProgressLine />
      <HeroSection />
      <Step1 />
      <Step2 />
      <Step3 />
      <Step4 />
      <Step5 />
      <ToolsShowcase />
      <CTASection />
    </>
  );
}
