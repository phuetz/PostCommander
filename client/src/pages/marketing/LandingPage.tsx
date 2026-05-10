import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Globe,
  BookOpen,
  Anchor,
  LayoutGrid,
  RefreshCw,
  Palette,
  ImagePlus,
  ArrowRight,
  MessageSquare,
  Target,
  Send,
  Star,
  Check,
  Play,
  Bot,
  Hash,
  FileText,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  ChevronDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';

/* ------------------------------------------------------------------ */
/*  Hero Section                                                       */
/* ------------------------------------------------------------------ */
function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center pt-20 lg:pt-0 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 grid-pattern" />

      {/* Floating orbs */}
      <div className="orb w-72 h-72 top-[10%] left-[5%] bg-[var(--color-accent-blue)]/20" />
      <div
        className="orb w-96 h-96 top-[60%] right-[5%] bg-[var(--color-accent-violet)]/15"
        style={{ animationDelay: '5s' }}
      />
      <div
        className="orb w-56 h-56 top-[30%] right-[30%] bg-[var(--color-accent-magenta)]/10"
        style={{ animationDelay: '10s' }}
      />
      <div
        className="orb w-40 h-40 bottom-[20%] left-[20%] bg-[var(--color-accent-cyan)]/10"
        style={{ animationDelay: '15s' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-fade-in-up animate-glow-pulse mb-8">
              <Sparkles size={14} className="text-[var(--color-accent-violet)]" />
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide uppercase">
                {t('marketing.hero.badge', 'Powered by 5 AI Models')}
              </span>
            </div>

            {/* Headline */}
            <h1 className="heading-xl mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <span className="text-white block">
                {t('marketing.hero.titleLine1', 'Command Your')}
              </span>
              <span
                className="gradient-text-brand animate-shimmer block"
                style={{ backgroundSize: '200% auto' }}
              >
                {t('marketing.hero.titleLine2', 'Social Empire')}
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              {t(
                'marketing.hero.subtitle',
                'AI-powered content creation for LinkedIn, X, Instagram, TikTok, Facebook & Pinterest. 5 AI models. One command center.',
              )}
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12 animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              <Link to="/app" className="btn-primary-glow">
                {t('marketing.hero.cta', 'Start Free \u2014 No Card Required')}
                <ArrowRight size={18} />
              </Link>
              <a href="#how-it-works" className="btn-ghost-glow">
                <Play size={16} />
                {t('marketing.hero.secondaryCta', 'Watch Demo')}
              </a>
            </div>

            {/* Stats bar */}
            <div
              className="glass-card inline-flex flex-wrap items-center gap-0 rounded-2xl animate-fade-in-up"
              style={{ animationDelay: '0.4s' }}
            >
              {[
                { value: '10,000+', label: t('marketing.hero.stat1', 'Posts Generated') },
                { value: '2,500+', label: t('marketing.hero.stat2', 'Creators') },
                { value: '6', label: t('marketing.hero.stat3', 'Platforms') },
              ].map((stat, i) => (
                <div key={stat.label} className="flex items-center">
                  {i > 0 && <div className="w-px h-8 bg-white/[0.06]" />}
                  <div className="px-5 py-3 text-center">
                    <div className="font-display text-lg font-bold text-white">{stat.value}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - App Mockup */}
          <div
            className="relative animate-fade-in-up hidden lg:block"
            style={{ animationDelay: '0.5s' }}
          >
            <div className="relative" style={{ perspective: '1200px' }}>
              {/* Glow behind */}
              <div className="absolute -inset-8 bg-gradient-to-r from-[var(--color-accent-blue)]/20 via-[var(--color-accent-violet)]/15 to-[var(--color-accent-magenta)]/10 rounded-3xl blur-3xl" />

              {/* Mock app window */}
              <div
                className="relative glass-card rounded-2xl overflow-hidden"
                style={{ transform: 'rotateY(-6deg) rotateX(3deg)' }}
              >
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-md bg-white/[0.04] text-[10px] text-[var(--color-text-muted)]">
                      app.postcommander.com
                    </div>
                  </div>
                </div>

                {/* Mock content */}
                <div className="p-5 space-y-4">
                  {/* Mock input */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                      {t('marketing.hero.mockLabel', 'Topic')}
                    </div>
                    <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-[var(--color-text-secondary)]">
                      <TypingEffect
                        text={t(
                          'marketing.hero.mockInput',
                          '5 productivity tips for remote workers',
                        )}
                      />
                    </div>
                  </div>

                  {/* Mock platform pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {['LinkedIn', 'X', 'Instagram'].map((p) => (
                      <span
                        key={p}
                        className="px-2.5 py-1 rounded-full text-[10px] font-medium glass text-[var(--color-accent-blue)]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* Mock output lines */}
                  <div className="relative p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="space-y-2">
                      <div className="h-2 bg-white/[0.06] rounded-full w-full" />
                      <div className="h-2 bg-white/[0.06] rounded-full w-5/6" />
                      <div className="h-2 bg-white/[0.06] rounded-full w-4/5" />
                      <div className="h-2 bg-white/[0.06] rounded-full w-full" />
                      <div className="h-2 bg-white/[0.06] rounded-full w-3/4" />
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--color-accent-emerald)]/10 text-[var(--color-accent-emerald)] text-[8px] font-semibold">
                      <Sparkles size={8} /> AI Generated
                    </div>
                  </div>

                  {/* Mock button */}
                  <div className="flex gap-2">
                    <div
                      className="flex-1 py-2 rounded-xl text-xs font-semibold text-center text-white"
                      style={{
                        background:
                          'linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-violet))',
                      }}
                    >
                      {t('marketing.hero.mockButton', 'Publish to All')}
                    </div>
                    <div className="px-4 py-2 rounded-xl border border-white/[0.06] text-xs font-medium text-[var(--color-text-secondary)] text-center">
                      {t('marketing.hero.mockSave', 'Save')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown size={20} className="text-[var(--color-text-muted)]" />
      </div>
    </section>
  );
}

/* Typing effect helper */
function TypingEffect({ text }: { text: string }) {
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
    }, 50);
    return () => clearInterval(interval);
  }, [text, done]);

  return (
    <span>
      {displayed}
      {!done && <span className="animate-pulse text-[var(--color-accent-violet)]">|</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Social Proof / Logo Marquee                                        */
/* ------------------------------------------------------------------ */
function SocialProofMarquee() {
  const { t } = useTranslation();
  const brands = [
    'Startup Inc',
    'CreatorCo',
    'MediaHub',
    'SocialFirst',
    'ContentPro',
    'GrowthLab',
    'LaunchPad',
    'ViralHQ',
  ];

  return (
    <section className="relative py-16 overflow-hidden border-y border-white/[0.04]">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />

      <div className="relative text-center mb-8">
        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
          {t('marketing.socialProof.title', 'Trusted by content creators worldwide')}
        </p>
      </div>

      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-[var(--color-surface)] to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-[var(--color-surface)] to-transparent" />

        {/* Marquee */}
        <div className="flex overflow-hidden">
          <div className="flex shrink-0 items-center gap-16 animate-[marquee_30s_linear_infinite]">
            {[...brands, ...brands].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="text-xl font-display font-bold text-white/[0.08] whitespace-nowrap select-none"
              >
                {name}
              </span>
            ))}
          </div>
          <div
            className="flex shrink-0 items-center gap-16 animate-[marquee_30s_linear_infinite]"
            aria-hidden="true"
          >
            {[...brands, ...brands].map((name, i) => (
              <span
                key={`dup-${name}-${i}`}
                className="text-xl font-display font-bold text-white/[0.08] whitespace-nowrap select-none"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Features Bento Grid                                                */
/* ------------------------------------------------------------------ */
function FeaturesBentoGrid() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Bot,
      title: t('marketing.features.multiAI.title', 'Multi-AI Generation'),
      description: t(
        'marketing.features.multiAI.desc',
        'GPT-4, Claude, Gemini, Mistral & Ollama. Each AI brings unique strengths.',
      ),
      span: 'lg:col-span-2',
      gradient: 'from-[var(--color-accent-blue)] to-[var(--color-accent-cyan)]',
    },
    {
      icon: Globe,
      title: t('marketing.features.platforms.title', '6 Platform Publishing'),
      description: t(
        'marketing.features.platforms.desc',
        'Optimized for LinkedIn, X, Instagram, Facebook, TikTok & Pinterest.',
      ),
      span: 'lg:row-span-2',
      gradient: 'from-[var(--color-accent-violet)] to-[var(--color-accent-blue)]',
    },
    {
      icon: BookOpen,
      title: t('marketing.features.viral.title', 'Viral Post Library'),
      description: t(
        'marketing.features.viral.desc',
        'Curated collection of viral posts. See what works and adapt winning patterns.',
      ),
      span: '',
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      icon: Anchor,
      title: t('marketing.features.hooks.title', 'Hook Generator'),
      description: t(
        'marketing.features.hooks.desc',
        'Attention-grabbing openers that stop the scroll and boost engagement.',
      ),
      span: '',
      gradient: 'from-[var(--color-accent-magenta)] to-rose-500',
    },
    {
      icon: LayoutGrid,
      title: t('marketing.features.carousel.title', 'Carousel & Thread Creator'),
      description: t(
        'marketing.features.carousel.desc',
        'Multi-slide carousels and Twitter threads that keep audiences engaged.',
      ),
      span: '',
      gradient: 'from-[var(--color-accent-emerald)] to-green-500',
    },
    {
      icon: RefreshCw,
      title: t('marketing.features.repurpose.title', 'Smart Repurposing'),
      description: t(
        'marketing.features.repurpose.desc',
        'One post transforms into platform-optimized content for all channels.',
      ),
      span: 'lg:col-span-2',
      gradient: 'from-[var(--color-accent-violet)] to-purple-500',
    },
    {
      icon: Palette,
      title: t('marketing.features.style.title', 'Style Cloning'),
      description: t(
        'marketing.features.style.desc',
        'Clone your writing voice or emulate top creators for consistent branding.',
      ),
      span: 'lg:row-span-2',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      icon: ImagePlus,
      title: t('marketing.features.images.title', 'AI Image Generation'),
      description: t(
        'marketing.features.images.desc',
        'Create stunning visuals that complement your posts and drive engagement.',
      ),
      span: '',
      gradient: 'from-fuchsia-500 to-[var(--color-accent-magenta)]',
    },
    {
      icon: FileText,
      title: t('marketing.features.templates.title', 'Templates Library'),
      description: t(
        'marketing.features.templates.desc',
        'Battle-tested templates for listicles, stories, hot takes, and more.',
      ),
      span: '',
      gradient: 'from-teal-500 to-[var(--color-accent-cyan)]',
    },
    {
      icon: Hash,
      title: t('marketing.features.hashtags.title', 'Hashtag Research'),
      description: t(
        'marketing.features.hashtags.desc',
        'Trending, niche, and engagement-optimized hashtag suggestions.',
      ),
      span: '',
      gradient: 'from-sky-500 to-[var(--color-accent-blue)]',
    },
  ];

  return (
    <section id="features" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="heading-lg mb-4 animate-fade-in-up">
            <span className="gradient-text-brand">
              {t('marketing.features.title', 'Everything You Need')}
            </span>
          </h2>
          <p
            className="text-[var(--color-text-secondary)] text-lg leading-relaxed animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            {t(
              'marketing.features.subtitle',
              'A complete arsenal of AI-powered tools to dominate every social platform.',
            )}
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={clsx(
                'group relative glass-card p-6 rounded-2xl overflow-hidden transition-all duration-500 hover:border-white/[0.12] animate-fade-in-up',
                feature.span,
              )}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div
                  className={clsx(
                    'absolute -inset-1 blur-2xl opacity-20 bg-gradient-to-br',
                    feature.gradient,
                  )}
                />
              </div>

              <div className="relative">
                {/* Icon */}
                <div
                  className={clsx(
                    'inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br mb-4',
                    feature.gradient,
                  )}
                >
                  <feature.icon size={20} className="text-white" />
                </div>

                <h3 className="font-display text-base font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <Link
            to="/features"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent-violet)] hover:text-white transition-colors group"
          >
            {t('marketing.features.viewAll', 'Explore all features')}
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How It Works                                                       */
/* ------------------------------------------------------------------ */
function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      step: '01',
      icon: MessageSquare,
      title: t('marketing.howItWorks.step1.title', 'Describe Your Idea'),
      description: t(
        'marketing.howItWorks.step1.desc',
        'Enter a topic, paste content to transform, or describe your post idea in natural language.',
      ),
    },
    {
      step: '02',
      icon: Target,
      title: t('marketing.howItWorks.step2.title', 'Choose Platform & Style'),
      description: t(
        'marketing.howItWorks.step2.desc',
        'Pick target platforms, tone of voice, language, and preferred AI model for optimal results.',
      ),
    },
    {
      step: '03',
      icon: Send,
      title: t('marketing.howItWorks.step3.title', 'Generate & Publish'),
      description: t(
        'marketing.howItWorks.step3.desc',
        'Get platform-optimized posts in seconds. Review, edit, and publish to all channels at once.',
      ),
    },
  ];

  return (
    <section id="how-it-works" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      {/* Asymmetric orb */}
      <div className="orb w-[500px] h-[500px] -right-40 top-1/4 bg-[var(--color-accent-violet)]/10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="heading-lg text-white mb-4 animate-fade-in-up">
            {t('marketing.howItWorks.title', 'Three Steps to Viral Content')}
          </h2>
          <p
            className="text-[var(--color-text-secondary)] text-lg animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            {t(
              'marketing.howItWorks.subtitle',
              'No learning curve. Idea to published post in under a minute.',
            )}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[15%] w-[70%] h-px">
            <div className="w-full h-full bg-gradient-to-r from-[var(--color-accent-blue)] via-[var(--color-accent-violet)] to-[var(--color-accent-magenta)] opacity-30" />
            {/* Moving dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--color-accent-violet)]"
              style={{
                animation: 'marquee 4s ease-in-out infinite alternate',
                boxShadow: '0 0 10px var(--color-accent-violet)',
              }}
            />
          </div>

          {steps.map((step, i) => (
            <div
              key={step.step}
              className="relative text-center animate-fade-in-up"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {/* Step number */}
              <div className="font-display text-6xl font-extrabold gradient-text-brand mb-6 leading-none select-none">
                {step.step}
              </div>

              {/* Icon circle */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass mb-6">
                <step.icon size={28} className="text-white" />
              </div>

              <h3 className="font-display text-lg font-bold text-white mb-3">{step.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-xs mx-auto">
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
/*  AI Models Showcase                                                 */
/* ------------------------------------------------------------------ */
function AIModelsShowcase() {
  const { t } = useTranslation();

  const models = [
    {
      name: 'OpenAI',
      models: 'GPT-4, GPT-4 Turbo',
      bestFor: t('marketing.ai.openai', 'Creative, engaging content with broad knowledge'),
      accent: 'var(--color-accent-emerald)',
      bgAccent: 'rgba(16,185,129,0.08)',
      borderAccent: 'rgba(16,185,129,0.2)',
    },
    {
      name: 'Anthropic',
      models: 'Claude 3.5',
      bestFor: t('marketing.ai.claude', 'Nuanced, professional writing with safety focus'),
      accent: 'var(--color-accent-violet)',
      bgAccent: 'rgba(139,92,246,0.08)',
      borderAccent: 'rgba(139,92,246,0.2)',
    },
    {
      name: 'Google',
      models: 'Gemini Pro',
      bestFor: t('marketing.ai.gemini', 'Fact-rich, research-based content generation'),
      accent: 'var(--color-accent-blue)',
      bgAccent: 'rgba(59,130,246,0.08)',
      borderAccent: 'rgba(59,130,246,0.2)',
    },
    {
      name: 'Mistral',
      models: 'Mistral Large, Medium',
      bestFor: t('marketing.ai.mistral', 'Outstanding multilingual content excellence'),
      accent: 'var(--color-accent-cyan)',
      bgAccent: 'rgba(6,182,212,0.08)',
      borderAccent: 'rgba(6,182,212,0.2)',
    },
    {
      name: 'Ollama',
      models: 'Llama 3, Phi-3',
      bestFor: t('marketing.ai.ollama', 'Free local AI for complete data privacy'),
      accent: 'var(--color-accent-magenta)',
      bgAccent: 'rgba(236,72,153,0.08)',
      borderAccent: 'rgba(236,72,153,0.2)',
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="heading-lg text-white mb-4 animate-fade-in-up">
            {t('marketing.ai.title', 'Choose Your AI')}
          </h2>
          <p
            className="text-[var(--color-text-secondary)] text-lg animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            {t(
              'marketing.ai.subtitle',
              'Five world-class AI models, each with unique strengths. Switch in one click.',
            )}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {models.map((model, i) => (
            <div
              key={model.name}
              className="glass-card p-5 rounded-2xl transition-all duration-300 hover:translate-y-[-4px] animate-fade-in-up group"
              style={{
                animationDelay: `${i * 0.08}s`,
                borderColor: model.borderAccent,
              }}
            >
              {/* Provider dot */}
              <div
                className="w-3 h-3 rounded-full mb-4"
                style={{
                  background: model.accent,
                  boxShadow: `0 0 12px ${model.bgAccent}`,
                }}
              />
              <h3 className="font-display text-sm font-bold text-white mb-1">{model.name}</h3>
              <p className="text-[10px] font-medium text-[var(--color-text-muted)] mb-3">
                {model.models}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {model.bestFor}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Platform Showcase                                                  */
/* ------------------------------------------------------------------ */
function PlatformShowcase() {
  const { t } = useTranslation();

  const platforms = [
    {
      name: 'LinkedIn',
      icon: Linkedin,
      description: t(
        'marketing.platforms.linkedin.desc',
        'Thought leadership posts that get 10x engagement',
      ),
      color: '#0A66C2',
    },
    {
      name: 'X / Twitter',
      icon: Twitter,
      description: t('marketing.platforms.twitter.desc', 'Viral tweets and threads that trend'),
      color: '#fff',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      description: t(
        'marketing.platforms.instagram.desc',
        'Captions and carousels that convert followers',
      ),
      color: '#E4405F',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      description: t(
        'marketing.platforms.facebook.desc',
        'Community posts that spark conversations',
      ),
      color: '#1877F2',
    },
    {
      name: 'TikTok',
      icon: Play,
      description: t('marketing.platforms.tiktok.desc', 'Descriptions that boost your video reach'),
      color: '#fff',
    },
    {
      name: 'Pinterest',
      icon: Target,
      description: t('marketing.platforms.pinterest.desc', 'Pin descriptions that drive traffic'),
      color: '#E60023',
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute inset-0 mesh-gradient opacity-30" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="heading-lg text-white mb-4 animate-fade-in-up">
            {t('marketing.platformShowcase.title', 'Optimized for Every Platform')}
          </h2>
          <p
            className="text-[var(--color-text-secondary)] text-lg animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            {t(
              'marketing.platformShowcase.subtitle',
              'Each platform has unique requirements. PostCommander generates perfectly formatted content for all of them.',
            )}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform, i) => (
            <div
              key={platform.name}
              className="group glass-card p-6 rounded-2xl transition-all duration-300 hover:translate-y-[-4px] hover:border-white/[0.12] animate-fade-in-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4"
                style={{ backgroundColor: `${platform.color}20` }}
              >
                <platform.icon size={20} style={{ color: platform.color }} />
              </div>
              <h3 className="font-display text-base font-bold text-white mb-2">{platform.name}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {platform.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonials                                                       */
/* ------------------------------------------------------------------ */
function Testimonials() {
  const { t } = useTranslation();

  const testimonials = [
    {
      quote: t(
        'marketing.testimonials.t1.quote',
        "PostCommander has saved me 10+ hours per week on content creation. I used to spend all morning writing posts - now I generate a week's worth in 15 minutes.",
      ),
      name: 'Sarah M.',
      role: t('marketing.testimonials.t1.role', 'Startup Founder'),
      initials: 'SM',
      gradient: 'from-[var(--color-accent-blue)] to-[var(--color-accent-violet)]',
    },
    {
      quote: t(
        'marketing.testimonials.t2.quote',
        'Managing 6 social platforms was a nightmare. PostCommander generates perfectly optimized content for each one. My engagement is up 300% across all channels.',
      ),
      name: 'Marc D.',
      role: t('marketing.testimonials.t2.role', 'Social Media Manager'),
      initials: 'MD',
      gradient: 'from-[var(--color-accent-violet)] to-[var(--color-accent-magenta)]',
    },
    {
      quote: t(
        'marketing.testimonials.t3.quote',
        'The writing quality is incredible. My clients think I hired a copywriter. The style cloning feature matches my voice perfectly - nobody can tell it is AI.',
      ),
      name: 'Yuki T.',
      role: t('marketing.testimonials.t3.role', 'Freelance Coach'),
      initials: 'YT',
      gradient: 'from-[var(--color-accent-magenta)] to-[var(--color-accent-blue)]',
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)] dot-pattern" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="heading-lg text-white mb-4 animate-fade-in-up">
            {t('marketing.testimonials.title', 'Loved by Creators')}
          </h2>
          <p
            className="text-[var(--color-text-secondary)] text-lg animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            {t(
              'marketing.testimonials.subtitle',
              'See what content creators say about PostCommander.',
            )}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <div
              key={item.name}
              className="relative glass-card p-8 rounded-2xl animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s`, marginTop: i === 1 ? '-16px' : '0' }}
            >
              {/* Decorative quote */}
              <div className="absolute -top-2 -left-1 font-display text-7xl font-extrabold gradient-text-brand opacity-20 select-none leading-none">
                &ldquo;
              </div>

              <div className="flex items-center gap-0.5 mb-5">
                {[...Array(5)].map((_, si) => (
                  <Star key={si} size={14} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6 italic font-body">
                &ldquo;{item.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold',
                    item.gradient,
                  )}
                >
                  {item.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{item.name}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{item.role}</div>
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
/*  Pricing Preview                                                    */
/* ------------------------------------------------------------------ */
function PricingPreview() {
  const { t } = useTranslation();

  const plans = [
    {
      name: t('marketing.pricing.free.name', 'Free'),
      price: '0',
      features: [
        t('marketing.pricing.free.f1', '10 posts/month'),
        t('marketing.pricing.free.f2', '1 AI provider'),
        t('marketing.pricing.free.f3', '2 platforms'),
        t('marketing.pricing.free.f4', 'Basic tones'),
      ],
      cta: t('marketing.pricing.free.cta', 'Start Free'),
      popular: false,
    },
    {
      name: t('marketing.pricing.pro.name', 'Pro'),
      price: '19',
      features: [
        t('marketing.pricing.pro.f1', 'Unlimited posts'),
        t('marketing.pricing.pro.f2', 'All 5 AI providers'),
        t('marketing.pricing.pro.f3', 'All 6 platforms'),
        t('marketing.pricing.pro.f4', 'Viral library & hooks'),
      ],
      cta: t('marketing.pricing.pro.cta', 'Go Pro'),
      popular: true,
    },
    {
      name: t('marketing.pricing.business.name', 'Business'),
      price: '49',
      features: [
        t('marketing.pricing.business.f1', 'Everything in Pro'),
        t('marketing.pricing.business.f2', 'Content pillars & planning'),
        t('marketing.pricing.business.f3', 'Performance simulator'),
        t('marketing.pricing.business.f4', 'Analytics & scheduling'),
      ],
      cta: t('marketing.pricing.business.cta', 'Go Business'),
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)] grid-pattern" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="heading-lg text-white mb-4 animate-fade-in-up">
            {t('marketing.pricing.title', 'Simple, Transparent Pricing')}
          </h2>
          <p
            className="text-[var(--color-text-secondary)] text-lg animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            {t('marketing.pricing.subtitle', 'Start free and scale as you grow. No hidden fees.')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={clsx(
                'relative animate-fade-in-up',
                plan.popular && 'md:-mt-4 md:mb-[-16px]',
              )}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {plan.popular && (
                <div className="gradient-border rounded-2xl">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span
                      className="px-4 py-1.5 rounded-full text-xs font-bold text-white"
                      style={{
                        background:
                          'linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-violet))',
                      }}
                    >
                      {t('marketing.pricing.popular', 'Most Popular')}
                    </span>
                  </div>
                </div>
              )}

              <div
                className={clsx(
                  'relative h-full p-8 rounded-2xl border transition-all duration-300',
                  plan.popular
                    ? 'bg-[var(--color-surface-raised)] border-white/[0.1] glow-border'
                    : 'glass-card hover:border-white/[0.1]',
                )}
              >
                <h3 className="font-display text-lg font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display text-4xl font-extrabold text-white">
                    {plan.price}&euro;
                  </span>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    /{t('marketing.pricing.month', 'mo')}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]"
                    >
                      <Check size={14} className="text-[var(--color-accent-emerald)] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.popular ? '/app' : '/pricing'}
                  className={clsx(
                    'block w-full text-center py-3 rounded-xl font-display font-semibold text-sm transition-all duration-200',
                    plan.popular
                      ? 'btn-primary-glow !py-3 !rounded-xl'
                      : 'btn-ghost-glow !py-3 !rounded-xl',
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent-violet)] hover:text-white transition-colors group"
          >
            {t('marketing.pricing.viewFull', 'View full pricing details')}
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Final CTA                                                          */
/* ------------------------------------------------------------------ */
function FinalCTA() {
  const { t } = useTranslation();

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 mesh-gradient opacity-60" />
      <div className="absolute inset-0 grid-pattern" />

      {/* Floating orbs */}
      <div className="orb w-80 h-80 top-[10%] left-[10%] bg-[var(--color-accent-blue)]/20" />
      <div
        className="orb w-60 h-60 bottom-[10%] right-[15%] bg-[var(--color-accent-magenta)]/15"
        style={{ animationDelay: '7s' }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="heading-lg text-white mb-6 animate-fade-in-up">
          {t('marketing.finalCta.titleLine1', 'Ready to')}{' '}
          <span className="gradient-text-brand">
            {t('marketing.finalCta.titleHighlight', 'Command')}
          </span>
          {t('marketing.finalCta.titleLine2', '?')}
        </h2>

        <p
          className="text-lg text-[var(--color-text-secondary)] mb-10 max-w-2xl mx-auto animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          {t(
            'marketing.finalCta.subtitle',
            'Free plan available. No credit card required. Start generating viral content in seconds.',
          )}
        </p>

        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Link to="/app" className="btn-primary-glow !text-lg !px-12 !py-5">
            {t('marketing.finalCta.cta', 'Get Started Free')}
            <ArrowRight size={22} />
          </Link>
        </div>

        <p
          className="mt-6 text-xs text-[var(--color-text-muted)] animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          {t('marketing.finalCta.note', 'No credit card required. Free plan forever.')}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Landing Page                                                       */
/* ------------------------------------------------------------------ */
export function LandingPage() {
  return (
    <>
      <HeroSection />
      <SocialProofMarquee />
      <FeaturesBentoGrid />
      <HowItWorks />
      <AIModelsShowcase />
      <PlatformShowcase />
      <Testimonials />
      <PricingPreview />
      <FinalCTA />
    </>
  );
}
