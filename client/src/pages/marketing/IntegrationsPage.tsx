import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Sparkles,
  Cpu,
  Globe,
  Zap,
  Shield,
  Lock,
  CreditCard,
  Code2,
  Send,
  Webhook,
  Radio,
  Vote,
  Eye,
  MessageSquare,
  Server,
  Brain,
  Network,
  ChevronRight,
  Star,
  Check,
  FileJson,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

/* ------------------------------------------------------------------ */
/*  Hub Visualization Node                                             */
/* ------------------------------------------------------------------ */
interface HubNodeProps {
  name: string;
  color: string;
  icon: React.ReactNode;
  angle: number;
  radius: number;
  delay: number;
}

function HubNode({ name, color, icon, angle, radius, delay }: HubNodeProps) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;

  return (
    <>
      {/* Connection line */}
      <div
        className="absolute top-1/2 left-1/2 origin-left transition-opacity duration-300"
        style={{
          width: `${radius}px`,
          height: '1px',
          transform: `rotate(${angle}deg)`,
          background: `linear-gradient(90deg, ${color}44, ${color}22, transparent)`,
          animationDelay: `${delay}ms`,
        }}
      >
        <div
          className="absolute inset-0 animate-glow-pulse"
          style={{
            background: `linear-gradient(90deg, ${color}66, ${color}33, transparent)`,
          }}
        />
      </div>

      {/* Node */}
      <div
        className="absolute group cursor-pointer"
        style={{
          top: `calc(50% + ${y}px)`,
          left: `calc(50% + ${x}px)`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className="glass-card px-3 py-2 sm:px-4 sm:py-3 flex items-center gap-2 transition-all duration-300 group-hover:scale-110"
          style={{
            boxShadow: `0 0 0 1px ${color}22`,
          }}
        >
          <div
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}22` }}
          >
            <span style={{ color }}>{icon}</span>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">
            {name}
          </span>
        </div>
        {/* Hover glow */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl"
          style={{ background: `${color}15` }}
        />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero Section                                                       */
/* ------------------------------------------------------------------ */
function IntegrationsHero() {
  const { t } = useTranslation();
  const [counters, setCounters] = useState({ integrations: 0, ai: 0, social: 0 });

  useEffect(() => {
    const duration = 1500;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);

      setCounters({
        integrations: Math.round(11 * ease),
        ai: Math.round(5 * ease),
        social: Math.round(6 * ease),
      });

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[80vh] flex items-center pt-24 lg:pt-0 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 grid-pattern" />

      <div className="orb w-72 h-72 top-[10%] left-[5%] bg-[var(--color-accent-blue)]/20" />
      <div className="orb w-96 h-96 top-[60%] right-[5%] bg-[var(--color-accent-violet)]/15" style={{ animationDelay: '5s' }} />
      <div className="orb w-56 h-56 top-[30%] right-[30%] bg-[var(--color-accent-cyan)]/10" style={{ animationDelay: '10s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-fade-in-up animate-glow-pulse mb-8">
          <Network size={14} className="text-[var(--color-accent-cyan)]" />
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide uppercase">
            {t('marketing.integrations.badge', 'Integrations Hub')}
          </span>
        </div>

        <h1 className="heading-lg text-white mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {t('marketing.integrations.heroTitle', 'Connected to')}{' '}
          <span className="gradient-text-cool">
            {t('marketing.integrations.heroTitleHighlight', 'Everything You Need')}
          </span>
        </h1>

        <p className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {t(
            'marketing.integrations.heroSubtitle',
            'PostCommander integrates with the world\'s most powerful AI models and social platforms',
          )}
        </p>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {[
            { value: `${counters.integrations}+`, label: t('marketing.integrations.statIntegrations', 'Integrations') },
            { value: `${counters.ai}`, label: t('marketing.integrations.statAI', 'AI Models') },
            { value: `${counters.social}`, label: t('marketing.integrations.statSocial', 'Social Platforms') },
          ].map((stat) => (
            <div key={stat.label} className="glass-card px-6 py-4 min-w-[120px]">
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
/*  Hub Visualization                                                  */
/* ------------------------------------------------------------------ */
function HubVisualization() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(220);

  useEffect(() => {
    function handleResize() {
      const w = containerRef.current?.offsetWidth ?? 800;
      if (w < 500) setRadius(130);
      else if (w < 700) setRadius(170);
      else setRadius(220);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const socialNodes = [
    { name: 'LinkedIn', color: '#0A66C2', icon: <Globe size={16} />, angle: 150 },
    { name: 'Twitter / X', color: '#9CA3AF', icon: <MessageSquare size={16} />, angle: 180 },
    { name: 'Instagram', color: '#E1306C', icon: <Star size={16} />, angle: 210 },
    { name: 'Facebook', color: '#1877F2', icon: <Globe size={16} />, angle: 240 },
    { name: 'TikTok', color: '#9CA3AF', icon: <Zap size={16} />, angle: 120 },
    { name: 'Pinterest', color: '#E60023', icon: <Eye size={16} />, angle: 270 },
  ];

  const aiNodes = [
    { name: 'OpenAI', color: '#00A67E', icon: <Brain size={16} />, angle: 330 },
    { name: 'Anthropic', color: '#D4A574', icon: <Sparkles size={16} />, angle: 0 },
    { name: 'Google', color: '#4285F4', icon: <Globe size={16} />, angle: 30 },
    { name: 'Mistral', color: '#FF7000', icon: <Zap size={16} />, angle: 60 },
    { name: 'Ollama', color: '#FFFFFF', icon: <Server size={16} />, angle: 90 },
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 dot-pattern" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="heading-md text-white mb-4 animate-fade-in-up">
            {t('marketing.integrations.hubTitle', 'Your Command Center')}
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto">
            {t('marketing.integrations.hubSubtitle', 'PostCommander sits at the heart of your content workflow, connecting AI and distribution in one place')}
          </p>
        </div>

        <div
          ref={containerRef}
          className="relative mx-auto animate-fade-in-up"
          style={{ height: `${radius * 2 + 140}px`, maxWidth: `${radius * 2 + 200}px` }}
        >
          {/* Center node */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="glass-card glow-border px-5 py-4 text-center">
              <div className="heading-sm gradient-text-brand mb-1">PostCommander</div>
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
                {t('marketing.integrations.hubCenter', 'Command Center')}
              </div>
            </div>
          </div>

          {/* Social nodes (left half) */}
          {socialNodes.map((node, i) => (
            <HubNode
              key={node.name}
              name={node.name}
              color={node.color}
              icon={node.icon}
              angle={node.angle}
              radius={radius}
              delay={i * 150}
            />
          ))}

          {/* AI nodes (right half) */}
          {aiNodes.map((node, i) => (
            <HubNode
              key={node.name}
              name={node.name}
              color={node.color}
              icon={node.icon}
              angle={node.angle}
              radius={radius}
              delay={(i + 6) * 150}
            />
          ))}

          {/* Labels */}
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
            <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold">
              {t('marketing.integrations.hubSocialLabel', 'Social Platforms')}
            </span>
          </div>
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
            <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold">
              {t('marketing.integrations.hubAILabel', 'AI Models')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  AI Models Section                                                  */
/* ------------------------------------------------------------------ */
interface AIModelCardProps {
  name: string;
  color: string;
  icon: React.ReactNode;
  bestFor: string;
  models: string[];
  description: string;
  specialNote?: string;
  index: number;
}

function AIModelCard({ name, color, icon, bestFor, models, description, specialNote, index }: AIModelCardProps) {
  return (
    <div
      className={clsx(
        'glass-card p-6 sm:p-8 group transition-all duration-300 hover:-translate-y-1 animate-fade-in-up',
        index % 2 === 0 ? 'lg:col-span-3' : 'lg:col-span-2',
      )}
      style={{
        borderLeft: `3px solid ${color}`,
        animationDelay: `${index * 0.1}s`,
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-2xl"
        style={{ background: `${color}08` }}
      />

      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ background: `${color}18` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <div>
          <h3 className="heading-sm text-white">{name}</h3>
          <span
            className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
            style={{ background: `${color}18`, color }}
          >
            {bestFor}
          </span>
        </div>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">{description}</p>

      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-2 font-semibold">
          Available Models
        </div>
        <div className="flex flex-wrap gap-2">
          {models.map((model) => (
            <span
              key={model}
              className="glass px-2.5 py-1 rounded-lg text-xs text-[var(--color-text-secondary)]"
            >
              {model}
            </span>
          ))}
        </div>
      </div>

      {specialNote && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ background: `${color}10`, color }}
        >
          <Shield size={14} />
          {specialNote}
        </div>
      )}
    </div>
  );
}

function AIModelsSection() {
  const { t } = useTranslation();

  const aiModels = [
    {
      name: 'OpenAI',
      color: '#00A67E',
      icon: <Brain size={22} />,
      bestFor: t('marketing.integrations.openai.bestFor', 'Creative writing, diverse styles'),
      models: ['GPT-4o (most capable)', 'GPT-4o Mini (fast & affordable)'],
      description: t(
        'marketing.integrations.openai.desc',
        'Industry-leading language models from OpenAI. GPT-4o delivers creative, nuanced content across every style, while GPT-4o Mini offers blazing-fast generation at a fraction of the cost.',
      ),
    },
    {
      name: 'Anthropic',
      color: '#D4A574',
      icon: <Sparkles size={22} />,
      bestFor: t('marketing.integrations.anthropic.bestFor', 'Nuanced, human-sounding content'),
      models: ['Claude Opus 4.6 (premium)', 'Claude Sonnet 4.6 (balanced)', 'Claude Haiku 4.5 (fast)'],
      description: t(
        'marketing.integrations.anthropic.desc',
        'Anthropic\'s Claude models produce thoughtful, nuanced content that reads naturally. From premium long-form with Opus to rapid-fire social posts with Haiku, find the perfect balance of quality and speed.',
      ),
    },
    {
      name: 'Google Gemini',
      color: '#4285F4',
      icon: <Globe size={22} />,
      bestFor: t('marketing.integrations.google.bestFor', 'Speed, multilingual content'),
      models: ['Gemini 2.0 Flash (fastest)', 'Gemini 2.0 Pro (most capable)'],
      description: t(
        'marketing.integrations.google.desc',
        'Google\'s Gemini models excel at rapid content generation and multilingual support. Gemini Flash is the fastest model in our lineup, perfect for high-volume content workflows.',
      ),
    },
    {
      name: 'Mistral',
      color: '#FF7000',
      icon: <Zap size={22} />,
      bestFor: t('marketing.integrations.mistral.bestFor', 'European languages, efficient generation'),
      models: ['Mistral Large (capable)', 'Mistral Small (compact)'],
      description: t(
        'marketing.integrations.mistral.desc',
        'Built in Europe, Mistral models deliver exceptional quality for European languages and efficient content generation. Great for multilingual brands targeting diverse markets.',
      ),
    },
    {
      name: 'Ollama (Local)',
      color: '#FFFFFF',
      icon: <Server size={22} />,
      bestFor: t('marketing.integrations.ollama.bestFor', 'Privacy, offline use, custom models'),
      models: ['Llama 3.3', 'Mistral 7B', 'Qwen 2.5', 'Any GGUF model'],
      description: t(
        'marketing.integrations.ollama.desc',
        'Run AI models entirely on your own hardware. Ollama integration means zero data leaves your machine \u2014 perfect for sensitive industries, compliance requirements, or simply keeping your content strategy private.',
      ),
      specialNote: t('marketing.integrations.ollama.privacy', '100% Private \u2014 Your data never leaves your machine'),
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute inset-0 grid-pattern" />
      <div className="orb w-72 h-72 top-[20%] right-[5%] bg-[var(--color-accent-emerald)]/10" style={{ animationDelay: '3s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-glow-pulse mb-6">
            <Cpu size={14} className="text-[var(--color-accent-emerald)]" />
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide uppercase">
              {t('marketing.integrations.aiBadge', 'AI Providers')}
            </span>
          </div>
          <h2 className="heading-md text-white mb-4">
            <span className="gradient-text-cool">
              {t('marketing.integrations.aiTitle', '5 AI Models, Unlimited Possibilities')}
            </span>
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            {t('marketing.integrations.aiSubtitle', 'Choose the perfect AI for every piece of content. Switch models instantly, compare outputs, and find your voice.')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {aiModels.map((model, index) => (
            <AIModelCard
              key={model.name}
              name={model.name}
              color={model.color}
              icon={model.icon}
              bestFor={model.bestFor}
              models={model.models}
              description={model.description}
              specialNote={model.specialNote}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Social Platforms Section                                            */
/* ------------------------------------------------------------------ */
interface SocialPlatformCardProps {
  name: string;
  color: string;
  gradient?: string;
  icon: React.ReactNode;
  features: string[];
  charLimit: string;
  bestFor: string;
  description: string;
  index: number;
}

function SocialPlatformCard({
  name,
  color,
  gradient,
  icon,
  features,
  charLimit,
  bestFor,
  description,
  index,
}: SocialPlatformCardProps) {
  return (
    <div
      className="glass-card p-6 group transition-all duration-300 hover:-translate-y-1 animate-fade-in-up relative overflow-hidden"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Platform color glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-3xl"
        style={{ background: gradient || `${color}10` }}
      />

      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{ background: gradient || `${color}22` }}
        >
          <span className="text-white">{icon}</span>
        </div>
        <h3 className="heading-sm text-white">{name}</h3>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">{description}</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="glass px-3 py-2 rounded-xl">
          <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-0.5">Char Limit</div>
          <div className="text-sm font-semibold text-white">{charLimit}</div>
        </div>
        <div className="glass px-3 py-2 rounded-xl">
          <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-0.5">Features</div>
          <div className="text-sm font-semibold text-white">{features.length}</div>
        </div>
      </div>

      {/* Features */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {features.map((f) => (
          <span key={f} className="glass px-2 py-0.5 rounded-md text-[11px] text-[var(--color-text-secondary)]">
            {f}
          </span>
        ))}
      </div>

      {/* Best for */}
      <div className="flex items-center gap-1.5 text-xs" style={{ color }}>
        <Star size={12} />
        <span className="font-semibold">{bestFor}</span>
      </div>
    </div>
  );
}

function SocialPlatformsSection() {
  const { t } = useTranslation();

  const platforms = [
    {
      name: 'LinkedIn',
      color: '#0A66C2',
      icon: <Globe size={20} />,
      features: [
        t('marketing.integrations.linkedin.f1', 'Professional posts'),
        t('marketing.integrations.linkedin.f2', 'Articles'),
        t('marketing.integrations.linkedin.f3', 'Carousels'),
        t('marketing.integrations.linkedin.f4', 'Company pages'),
      ],
      charLimit: '3,000',
      bestFor: t('marketing.integrations.linkedin.bestFor', 'B2B, thought leadership, professional networking'),
      description: t(
        'marketing.integrations.linkedin.desc',
        'Dominate professional networking with AI-crafted posts optimized for LinkedIn\'s algorithm. Generate articles, carousels, and company page content with OAuth2 integration.',
      ),
    },
    {
      name: 'X / Twitter',
      color: '#9CA3AF',
      icon: <MessageSquare size={20} />,
      features: [
        t('marketing.integrations.twitter.f1', 'Tweets'),
        t('marketing.integrations.twitter.f2', 'Threads'),
        t('marketing.integrations.twitter.f3', 'Polls'),
      ],
      charLimit: '280',
      bestFor: t('marketing.integrations.twitter.bestFor', 'Real-time engagement, trending topics'),
      description: t(
        'marketing.integrations.twitter.desc',
        'Craft viral tweets and engaging threads that capture attention in 280 characters. Thread optimization ensures your story unfolds perfectly across multiple posts.',
      ),
    },
    {
      name: 'Instagram',
      color: '#E1306C',
      gradient: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)',
      icon: <Star size={20} />,
      features: [
        t('marketing.integrations.instagram.f1', 'Captions'),
        t('marketing.integrations.instagram.f2', 'Carousels'),
        t('marketing.integrations.instagram.f3', 'Stories'),
        t('marketing.integrations.instagram.f4', 'Reels descriptions'),
      ],
      charLimit: '2,200',
      bestFor: t('marketing.integrations.instagram.bestFor', 'Visual brands, lifestyle, creative'),
      description: t(
        'marketing.integrations.instagram.desc',
        'Generate scroll-stopping captions with optimized hashtags. From carousel descriptions to reel scripts, create content that resonates with visual-first audiences.',
      ),
    },
    {
      name: 'Facebook',
      color: '#1877F2',
      icon: <Globe size={20} />,
      features: [
        t('marketing.integrations.facebook.f1', 'Posts'),
        t('marketing.integrations.facebook.f2', 'Stories'),
        t('marketing.integrations.facebook.f3', 'Group posts'),
        t('marketing.integrations.facebook.f4', 'Page content'),
      ],
      charLimit: '63,206',
      bestFor: t('marketing.integrations.facebook.bestFor', 'Community building, events, diverse audiences'),
      description: t(
        'marketing.integrations.facebook.desc',
        'Build thriving communities with engaging posts, stories, and group content. Facebook\'s generous character limit means more room for compelling storytelling.',
      ),
    },
    {
      name: 'TikTok',
      color: '#FF004F',
      icon: <Zap size={20} />,
      features: [
        t('marketing.integrations.tiktok.f1', 'Video descriptions'),
        t('marketing.integrations.tiktok.f2', 'Hashtag optimization'),
      ],
      charLimit: '2,200',
      bestFor: t('marketing.integrations.tiktok.bestFor', 'Gen Z, viral trends, entertainment'),
      description: t(
        'marketing.integrations.tiktok.desc',
        'Generate viral video descriptions with trend-aware hashtags. Optimize your content for TikTok\'s discovery algorithm and reach the next generation of consumers.',
      ),
    },
    {
      name: 'Pinterest',
      color: '#E60023',
      icon: <Eye size={20} />,
      features: [
        t('marketing.integrations.pinterest.f1', 'Pin descriptions'),
        t('marketing.integrations.pinterest.f2', 'Board organization'),
      ],
      charLimit: '500',
      bestFor: t('marketing.integrations.pinterest.bestFor', 'E-commerce, DIY, visual discovery'),
      description: t(
        'marketing.integrations.pinterest.desc',
        'Create search-optimized pin descriptions that drive traffic and sales. Pinterest\'s unique discovery engine rewards well-crafted descriptions with lasting visibility.',
      ),
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 dot-pattern" />
      <div className="orb w-80 h-80 bottom-[10%] left-[5%] bg-[var(--color-accent-magenta)]/10" style={{ animationDelay: '7s' }} />
      <div className="orb w-56 h-56 top-[15%] right-[10%] bg-[var(--color-accent-blue)]/15" style={{ animationDelay: '12s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-glow-pulse mb-6">
            <Send size={14} className="text-[var(--color-accent-magenta)]" />
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide uppercase">
              {t('marketing.integrations.socialBadge', 'Social Platforms')}
            </span>
          </div>
          <h2 className="heading-md text-white mb-4">
            {t('marketing.integrations.socialTitle', 'Publish Where Your')}{' '}
            <span className="gradient-text-brand">
              {t('marketing.integrations.socialTitleHighlight', 'Audience Lives')}
            </span>
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            {t('marketing.integrations.socialSubtitle', 'One click to publish optimized content across six major platforms. Each post tailored to the platform\'s audience and format.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map((platform, index) => (
            <SocialPlatformCard key={platform.name} {...platform} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Payment Integration (Stripe)                                       */
/* ------------------------------------------------------------------ */
function PaymentSection() {
  const { t } = useTranslation();

  const trustBadges = [
    { icon: <Shield size={16} />, label: t('marketing.integrations.stripe.pci', 'PCI DSS Compliant') },
    { icon: <Lock size={16} />, label: t('marketing.integrations.stripe.ssl', 'SSL Encrypted') },
    { icon: <Check size={16} />, label: t('marketing.integrations.stripe.gdpr', 'GDPR Compliant') },
  ];

  const features = [
    t('marketing.integrations.stripe.f1', 'Subscription management'),
    t('marketing.integrations.stripe.f2', 'Automated invoicing'),
    t('marketing.integrations.stripe.f3', 'Customer portal'),
    t('marketing.integrations.stripe.f4', 'Usage-based billing'),
    t('marketing.integrations.stripe.f5', 'Multiple currencies'),
    t('marketing.integrations.stripe.f6', 'Tax calculation'),
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute inset-0 grid-pattern" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 sm:p-12 animate-fade-in-up" style={{ borderLeft: '3px solid #635BFF' }}>
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(99, 91, 255, 0.15)' }}
            >
              <CreditCard size={28} className="text-[#635BFF]" />
            </div>
            <div className="flex-1">
              <h3 className="heading-sm text-white mb-2">
                {t('marketing.integrations.stripe.title', 'Secure Payments with Stripe')}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
                {t(
                  'marketing.integrations.stripe.desc',
                  'Enterprise-grade payment processing powers PostCommander subscriptions. Your payment data is handled exclusively by Stripe \u2014 we never see or store your card details.',
                )}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <Check size={14} className="text-[#635BFF] flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                {trustBadges.map((badge) => (
                  <div
                    key={badge.label}
                    className="glass px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]"
                  >
                    <span className="text-[#635BFF]">{badge.icon}</span>
                    {badge.label}
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
/*  Coming Soon                                                        */
/* ------------------------------------------------------------------ */
function ComingSoonSection() {
  const { t } = useTranslation();

  const upcoming = [
    { name: 'YouTube', color: '#FF0000', icon: <Globe size={20} /> },
    { name: 'Threads', color: '#000000', icon: <MessageSquare size={20} /> },
    { name: 'Mastodon', color: '#6364FF', icon: <Globe size={20} /> },
    { name: 'Bluesky', color: '#0085FF', icon: <Globe size={20} /> },
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 dot-pattern" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="heading-sm text-white mb-2">
            {t('marketing.integrations.comingSoon', 'Coming Soon')}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t('marketing.integrations.comingSoonDesc', 'Vote for the integrations you want most')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {upcoming.map((item, index) => (
            <div
              key={item.name}
              className="glass-card p-5 text-center opacity-60 hover:opacity-90 transition-all duration-300 group animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: `${item.color}15` }}
              >
                <span style={{ color: item.color === '#000000' ? '#9CA3AF' : item.color }}>
                  {item.icon}
                </span>
              </div>
              <div className="text-sm font-semibold text-white mb-3">{item.name}</div>
              <button className="btn-ghost-glow !px-4 !py-2 !text-xs group-hover:border-[var(--color-accent-violet)]/30">
                <Vote size={12} />
                {t('marketing.integrations.vote', 'Vote')}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="#"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent-violet)] hover:text-white transition-colors group"
          >
            {t('marketing.integrations.joinWaitlist', 'Join the waitlist for early access')}
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Developer API                                                      */
/* ------------------------------------------------------------------ */
function DeveloperAPISection() {
  const { t } = useTranslation();

  const apiFeatures = [
    { icon: <Code2 size={18} />, label: t('marketing.integrations.api.rest', 'REST API'), desc: t('marketing.integrations.api.restDesc', 'Standard RESTful endpoints with JSON') },
    { icon: <Radio size={18} />, label: t('marketing.integrations.api.streaming', 'Streaming'), desc: t('marketing.integrations.api.streamingDesc', 'Real-time SSE for live generation') },
    { icon: <Webhook size={18} />, label: t('marketing.integrations.api.webhooks', 'Webhooks'), desc: t('marketing.integrations.api.webhooksDesc', 'Event-driven notifications') },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute inset-0 grid-pattern" />
      <div className="orb w-64 h-64 top-[20%] left-[10%] bg-[var(--color-accent-cyan)]/10" style={{ animationDelay: '5s' }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-glow-pulse mb-6">
            <FileJson size={14} className="text-[var(--color-accent-cyan)]" />
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide uppercase">
              {t('marketing.integrations.apiBadge', 'Developer API')}
            </span>
          </div>
          <h2 className="heading-md text-white mb-4">
            {t('marketing.integrations.apiTitle', 'Build with')}{' '}
            <span className="gradient-text-cool">
              {t('marketing.integrations.apiTitleHighlight', 'PostCommander API')}
            </span>
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-xl mx-auto">
            {t('marketing.integrations.apiSubtitle', 'Integrate AI content generation directly into your workflows, products, and automations.')}
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Code snippet */}
          <div className="lg:col-span-3 glass-card overflow-hidden animate-fade-in-up">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-2 text-[11px] text-[var(--color-text-muted)] font-mono">generate.sh</span>
            </div>
            <pre className="p-6 overflow-x-auto">
              <code className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-mono)' }}>
                <span className="text-[var(--color-accent-cyan)]">POST</span>{' '}
                <span className="text-[var(--color-text-secondary)]">/api/generate</span>
                {'\n'}
                <span className="text-[var(--color-text-muted)]">{'{'}</span>
                {'\n'}
                {'  '}<span className="text-[var(--color-accent-magenta)]">"prompt"</span>
                <span className="text-[var(--color-text-muted)]">:</span>{' '}
                <span className="text-[var(--color-accent-emerald)]">"5 AI tips for productivity"</span>
                <span className="text-[var(--color-text-muted)]">,</span>
                {'\n'}
                {'  '}<span className="text-[var(--color-accent-magenta)]">"platforms"</span>
                <span className="text-[var(--color-text-muted)]">:</span>{' '}
                <span className="text-[var(--color-accent-emerald)]">["linkedin", "twitter"]</span>
                <span className="text-[var(--color-text-muted)]">,</span>
                {'\n'}
                {'  '}<span className="text-[var(--color-accent-magenta)]">"tone"</span>
                <span className="text-[var(--color-text-muted)]">:</span>{' '}
                <span className="text-[var(--color-accent-emerald)]">"professional"</span>
                <span className="text-[var(--color-text-muted)]">,</span>
                {'\n'}
                {'  '}<span className="text-[var(--color-accent-magenta)]">"provider"</span>
                <span className="text-[var(--color-text-muted)]">:</span>{' '}
                <span className="text-[var(--color-accent-emerald)]">"anthropic"</span>
                <span className="text-[var(--color-text-muted)]">,</span>
                {'\n'}
                {'  '}<span className="text-[var(--color-accent-magenta)]">"model"</span>
                <span className="text-[var(--color-text-muted)]">:</span>{' '}
                <span className="text-[var(--color-accent-emerald)]">"claude-sonnet-4-6"</span>
                {'\n'}
                <span className="text-[var(--color-text-muted)]">{'}'}</span>
              </code>
            </pre>
          </div>

          {/* API features */}
          <div className="lg:col-span-2 space-y-4">
            {apiFeatures.map((feature, i) => (
              <div
                key={feature.label}
                className="glass-card p-5 group hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[var(--color-accent-cyan)]">{feature.icon}</span>
                  <span className="font-display font-semibold text-white">{feature.label}</span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{feature.desc}</p>
              </div>
            ))}

            <Link
              to="#"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent-cyan)] hover:text-white transition-colors group mt-4"
            >
              {t('marketing.integrations.apiDocs', 'View API Docs')}
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Final CTA                                                          */
/* ------------------------------------------------------------------ */
function IntegrationsCTA() {
  const { t } = useTranslation();

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 mesh-gradient opacity-60" />
      <div className="absolute inset-0 grid-pattern" />

      <div className="orb w-80 h-80 top-[10%] left-[10%] bg-[var(--color-accent-blue)]/20" />
      <div className="orb w-60 h-60 bottom-[10%] right-[15%] bg-[var(--color-accent-magenta)]/15" style={{ animationDelay: '7s' }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="heading-lg text-white mb-6 animate-fade-in-up">
          {t('marketing.integrations.ctaTitle', 'Start')}{' '}
          <span className="gradient-text-brand">
            {t('marketing.integrations.ctaTitleHighlight', 'Connecting')}
          </span>{' '}
          {t('marketing.integrations.ctaTitleEnd', 'Today')}
        </h2>

        <p className="text-lg text-[var(--color-text-secondary)] mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {t('marketing.integrations.ctaSubtitle', 'Set up your integrations in minutes. Connect your AI models and social platforms, then let PostCommander handle the rest.')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Link to="/app" className="btn-primary-glow !text-lg !px-10 !py-5">
            {t('marketing.integrations.ctaPrimary', 'Get Started Free')}
            <ArrowRight size={20} />
          </Link>
          <Link to="/pricing" className="btn-ghost-glow !text-lg !px-10 !py-5">
            {t('marketing.integrations.ctaSecondary', 'View Pricing')}
          </Link>
        </div>

        <p className="mt-6 text-xs text-[var(--color-text-muted)] animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {t('marketing.integrations.ctaNote', 'Free plan includes all integrations. No credit card required.')}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Integrations Page                                                  */
/* ------------------------------------------------------------------ */
export function IntegrationsPage() {
  return (
    <>
      <IntegrationsHero />
      <HubVisualization />
      <AIModelsSection />
      <SocialPlatformsSection />
      <PaymentSection />
      <ComingSoonSection />
      <DeveloperAPISection />
      <IntegrationsCTA />
    </>
  );
}
