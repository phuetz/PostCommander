import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bot,
  Globe,
  BookOpen,
  Anchor,
  LayoutGrid,
  RefreshCw,
  Palette,
  ImagePlus,
  ArrowRight,
  Check,
  FileText,
  Hash,
} from 'lucide-react';
import clsx from 'clsx';

/* ------------------------------------------------------------------ */
/*  Feature Detail Section                                             */
/* ------------------------------------------------------------------ */
interface FeatureDetailProps {
  icon: React.ElementType;
  title: string;
  description: string;
  benefits: string[];
  gradient: string;
  reverse?: boolean;
  mockup: React.ReactNode;
}

function FeatureDetail({
  icon: Icon,
  title,
  description,
  benefits,
  gradient,
  reverse,
  mockup,
}: FeatureDetailProps) {
  return (
    <div className={clsx('grid lg:grid-cols-2 gap-12 lg:gap-16 items-center')}>
      <div className={clsx(reverse && 'lg:order-2')}>
        {/* Icon */}
        <div
          className={clsx(
            'inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br mb-6',
            gradient,
          )}
        >
          <Icon size={24} className="text-white" />
        </div>

        <h3 className="heading-md text-white mb-4">{title}</h3>
        <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">{description}</p>
        <ul className="space-y-3">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <Check size={16} className="text-[var(--color-accent-emerald)] mt-0.5 shrink-0" />
              <span className="text-sm text-[var(--color-text-secondary)]">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mockup */}
      <div className={clsx(reverse && 'lg:order-1')}>{mockup}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mockup components                                                  */
/* ------------------------------------------------------------------ */
function AIProviderMockup() {
  const providers = [
    { name: 'GPT-4', color: 'var(--color-accent-emerald)' },
    { name: 'Claude', color: 'var(--color-accent-violet)' },
    { name: 'Gemini', color: 'var(--color-accent-blue)' },
    { name: 'Mistral', color: 'var(--color-accent-cyan)' },
    { name: 'Ollama', color: 'var(--color-accent-magenta)' },
  ];
  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {providers.map((p) => (
          <div
            key={p.name}
            className="glass p-4 rounded-xl text-center transition-all duration-300 hover:border-white/[0.12] group"
          >
            <div
              className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center"
              style={{ backgroundColor: `${p.color}20` }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: p.color, boxShadow: `0 0 8px ${p.color}40` }}
              />
            </div>
            <span className="text-xs font-semibold text-white">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlatformGridMockup() {
  const platforms = [
    { name: 'LinkedIn', chars: '3,000', color: '#0A66C2' },
    { name: 'X', chars: '280', color: '#fff' },
    { name: 'Instagram', chars: '2,200', color: '#E4405F' },
    { name: 'Facebook', chars: '63,206', color: '#1877F2' },
    { name: 'TikTok', chars: '2,200', color: '#fff' },
    { name: 'Pinterest', chars: '500', color: '#E60023' },
  ];
  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {platforms.map((p) => (
          <div key={p.name} className="glass p-3 rounded-xl">
            <span className="text-xs font-bold text-white block mb-1">{p.name}</span>
            <span className="text-[10px] text-[var(--color-text-muted)]">{p.chars} chars</span>
            <div className="mt-2 w-full h-1 rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full"
                style={{ width: '65%', background: p.color, opacity: 0.6 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LibraryMockup() {
  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="space-y-3">
        {[
          { engagement: '12.4K', topic: 'Productivity hack for founders' },
          { engagement: '8.2K', topic: 'Why most startups fail at marketing' },
          { engagement: '15.1K', topic: 'The 5-4-3-2-1 morning routine' },
          { engagement: '6.8K', topic: 'Remote work is not the future...' },
        ].map((post) => (
          <div key={post.topic} className="glass p-3 rounded-xl flex items-center gap-3">
            <div className="px-2 py-1 rounded-md bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] text-[10px] font-bold shrink-0">
              {post.engagement}
            </div>
            <span className="text-xs text-[var(--color-text-secondary)] truncate">
              {post.topic}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HooksMockup() {
  const { t } = useTranslation();
  const hooks = [
    t('features.hookExample1', 'Stop scrolling. This will change how you think about...'),
    t(
      'features.hookExample2',
      'I spent 10 years learning this the hard way. Here it is in 30 seconds:',
    ),
    t('features.hookExample3', 'The biggest lie in social media marketing is...'),
    t('features.hookExample4', 'What if everything you know about productivity is wrong?'),
  ];
  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="space-y-3">
        {hooks.map((hook, i) => (
          <div key={i} className="glass p-3 rounded-xl">
            <p className="text-xs text-[var(--color-text-secondary)] italic leading-relaxed">
              &ldquo;{hook}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CarouselMockup() {
  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {['Hook Slide', 'Value #1', 'Value #2', 'Value #3', 'CTA Slide'].map((slide, i) => (
          <div
            key={slide}
            className="glass p-4 rounded-xl shrink-0 w-28 h-36 flex flex-col justify-between"
          >
            <div className="text-[8px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Slide {i + 1}
            </div>
            <div className="space-y-1">
              <div className="h-1.5 bg-white/[0.08] rounded-full w-full" />
              <div className="h-1.5 bg-white/[0.08] rounded-full w-3/4" />
              <div className="h-1.5 bg-white/[0.08] rounded-full w-5/6" />
            </div>
            <span className="text-[9px] font-medium text-[var(--color-accent-violet)]">
              {slide}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RepurposeMockup() {
  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="grid grid-cols-2 gap-3">
        <div className="glass p-3 rounded-xl col-span-2">
          <div className="text-[9px] font-bold text-[var(--color-accent-blue)] mb-2 uppercase">
            Original (LinkedIn)
          </div>
          <div className="space-y-1">
            <div className="h-1.5 bg-white/[0.08] rounded-full w-full" />
            <div className="h-1.5 bg-white/[0.08] rounded-full w-5/6" />
            <div className="h-1.5 bg-white/[0.08] rounded-full w-4/5" />
          </div>
        </div>
        {['X Thread', 'Instagram', 'TikTok'].map((p) => (
          <div key={p} className="glass p-3 rounded-xl">
            <div className="text-[9px] font-bold text-[var(--color-accent-violet)] mb-2 uppercase">
              {p}
            </div>
            <div className="space-y-1">
              <div className="h-1 bg-white/[0.06] rounded-full w-full" />
              <div className="h-1 bg-white/[0.06] rounded-full w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StyleCloneMockup() {
  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="space-y-3">
        <div className="glass p-3 rounded-xl">
          <div className="text-[9px] font-bold text-[var(--color-accent-magenta)] mb-2 uppercase">
            Your Style Profile
          </div>
          <div className="flex gap-2 flex-wrap">
            {['Conversational', 'Data-driven', 'Story-first', 'Short sentences'].map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[8px] font-medium glass text-[var(--color-text-secondary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass p-3 rounded-xl">
            <div className="text-[9px] font-bold text-[var(--color-text-muted)] mb-1">
              Vocabulary
            </div>
            <div className="h-12 rounded-lg bg-gradient-to-t from-[var(--color-accent-violet)]/10 to-transparent" />
          </div>
          <div className="glass p-3 rounded-xl">
            <div className="text-[9px] font-bold text-[var(--color-text-muted)] mb-1">Tone</div>
            <div className="h-12 rounded-lg bg-gradient-to-t from-[var(--color-accent-blue)]/10 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageGenMockup() {
  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="grid grid-cols-2 gap-3">
        {[
          'from-blue-600/30 to-cyan-600/20',
          'from-violet-600/30 to-purple-600/20',
          'from-emerald-600/30 to-green-600/20',
          'from-rose-600/30 to-pink-600/20',
        ].map((g, i) => (
          <div
            key={i}
            className={clsx(
              'aspect-square rounded-xl bg-gradient-to-br border border-white/[0.04]',
              g,
            )}
          >
            <div className="w-full h-full flex items-center justify-center">
              <ImagePlus size={20} className="text-white/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplatesMockup() {
  const templates = ['Listicle', 'Story Arc', 'Hot Take', 'Tutorial', 'Case Study', 'Thread'];
  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {templates.map((tpl) => (
          <div
            key={tpl}
            className="glass p-3 rounded-xl text-center transition-all duration-200 hover:border-white/[0.12]"
          >
            <div className="w-6 h-6 rounded-lg mx-auto mb-2 bg-gradient-to-br from-[var(--color-accent-blue)]/20 to-[var(--color-accent-violet)]/20 flex items-center justify-center">
              <FileText size={12} className="text-[var(--color-accent-violet)]" />
            </div>
            <span className="text-[10px] font-semibold text-[var(--color-text-secondary)]">
              {tpl}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HashtagMockup() {
  const tags = [
    '#productivity',
    '#remote',
    '#leadership',
    '#startup',
    '#growth',
    '#marketing',
    '#content',
    '#ai',
    '#tech',
    '#social',
    '#brand',
    '#creator',
  ];
  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, i) => {
          const sizes = ['text-xs', 'text-sm', 'text-[10px]', 'text-base'];
          const opacities = ['opacity-40', 'opacity-60', 'opacity-80', 'opacity-100'];
          return (
            <span
              key={tag}
              className={clsx(
                'font-medium text-[var(--color-accent-blue)] transition-all duration-200 hover:text-white cursor-default',
                sizes[i % sizes.length],
                opacities[i % opacities.length],
              )}
            >
              {tag}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Features Page                                                      */
/* ------------------------------------------------------------------ */
export function FeaturesPage() {
  const { t } = useTranslation();

  const features: (FeatureDetailProps & { bgClass?: string })[] = [
    {
      icon: Bot,
      title: t('features.multiAI.title', 'Multi-AI Generation'),
      description: t(
        'features.multiAI.desc',
        'Harness the power of 5 leading AI models. Each excels at different content types - GPT-4 for creative flair, Claude for nuanced professional tone, Gemini for fact-rich content, Mistral for multilingual excellence, Ollama for fully private local generation.',
      ),
      benefits: [
        t('features.multiAI.b1', 'Switch between models with one click'),
        t('features.multiAI.b2', 'Compare outputs from different AI models'),
        t('features.multiAI.b3', 'Use your own API keys or our built-in quota'),
        t('features.multiAI.b4', 'Local AI with Ollama for complete privacy'),
      ],
      gradient: 'from-[var(--color-accent-blue)] to-[var(--color-accent-cyan)]',
      mockup: <AIProviderMockup />,
    },
    {
      icon: Globe,
      title: t('features.sixPlatforms.title', '6 Platform Publishing'),
      description: t(
        'features.sixPlatforms.desc',
        'Generate perfectly formatted content for LinkedIn, X/Twitter, Facebook, Instagram, TikTok, and Pinterest. Each post is automatically optimized for the target platform.',
      ),
      benefits: [
        t('features.sixPlatforms.b1', 'Auto character limit enforcement'),
        t('features.sixPlatforms.b2', 'Platform-specific formatting and emojis'),
        t('features.sixPlatforms.b3', 'Optimal hashtag count per platform'),
        t('features.sixPlatforms.b4', 'One-click cross-platform publishing'),
      ],
      gradient: 'from-[var(--color-accent-violet)] to-[var(--color-accent-blue)]',
      reverse: true,
      mockup: <PlatformGridMockup />,
    },
    {
      icon: BookOpen,
      title: t('features.viralLibrary.title', 'Viral Post Library'),
      description: t(
        'features.viralLibrary.desc',
        'Browse a curated collection of viral posts from top creators. See what works, understand why it went viral, and use winning patterns as templates for your own content.',
      ),
      benefits: [
        t('features.viralLibrary.b1', 'Thousands of real viral posts cataloged'),
        t('features.viralLibrary.b2', 'Filter by platform, industry, and tone'),
        t('features.viralLibrary.b3', 'Engagement metrics and analysis'),
        t('features.viralLibrary.b4', 'One-click adaptation to your style'),
      ],
      gradient: 'from-orange-500 to-amber-500',
      mockup: <LibraryMockup />,
    },
    {
      icon: Anchor,
      title: t('features.hookGen.title', 'Hook Generator'),
      description: t(
        'features.hookGen.desc',
        'The first line decides if people read or scroll past. Generate attention-grabbing openers, provocative questions, and curiosity-inducing hooks that stop the scroll.',
      ),
      benefits: [
        t('features.hookGen.b1', 'Dozens of proven hook templates'),
        t('features.hookGen.b2', 'A/B test different openers'),
        t('features.hookGen.b3', 'Industry-specific hooks'),
        t('features.hookGen.b4', 'Engagement-optimized formulas'),
      ],
      gradient: 'from-[var(--color-accent-magenta)] to-rose-500',
      reverse: true,
      mockup: <HooksMockup />,
    },
    {
      icon: LayoutGrid,
      title: t('features.carousel.title', 'Carousel & Thread Creator'),
      description: t(
        'features.carousel.desc',
        'Create multi-slide Instagram carousels and Twitter threads that keep audiences engaged slide by slide. Each slide is crafted to drive swiping and reading.',
      ),
      benefits: [
        t('features.carousel.b1', 'Auto-split content into optimal slides'),
        t('features.carousel.b2', 'Hook slide + value slides + CTA slide'),
        t('features.carousel.b3', 'Twitter thread with numbered tweets'),
        t('features.carousel.b4', 'Visual layout suggestions'),
      ],
      gradient: 'from-[var(--color-accent-emerald)] to-green-500',
      mockup: <CarouselMockup />,
    },
    {
      icon: RefreshCw,
      title: t('features.repurpose.title', 'Smart Repurposing'),
      description: t(
        'features.repurpose.desc',
        'Write once, publish everywhere. Transform a single piece of content into platform-optimized versions for all your channels automatically.',
      ),
      benefits: [
        t('features.repurpose.b1', 'One post transforms into 6 platform versions'),
        t('features.repurpose.b2', 'Preserves core message while adapting format'),
        t('features.repurpose.b3', 'Adjusts tone for each platform audience'),
        t('features.repurpose.b4', 'Saves hours of manual rewriting'),
      ],
      gradient: 'from-orange-500 to-red-500',
      reverse: true,
      mockup: <RepurposeMockup />,
    },
    {
      icon: Palette,
      title: t('features.styleClone.title', 'Writing Style Cloning'),
      description: t(
        'features.styleClone.desc',
        'Paste samples of your writing or any creator you admire. The AI learns the style, tone, vocabulary, and structure - then generates content that sounds exactly like you.',
      ),
      benefits: [
        t('features.styleClone.b1', 'Clone your unique writing voice'),
        t('features.styleClone.b2', 'Emulate top creators in your niche'),
        t('features.styleClone.b3', 'Consistent brand voice across all content'),
        t('features.styleClone.b4', 'Save multiple style profiles'),
      ],
      gradient: 'from-amber-500 to-orange-500',
      mockup: <StyleCloneMockup />,
    },
    {
      icon: ImagePlus,
      title: t('features.imageGen.title', 'AI Image Generation'),
      description: t(
        'features.imageGen.desc',
        'Create stunning visuals to accompany your posts. Generate custom images, graphics, and illustrations that match your content and boost engagement.',
      ),
      benefits: [
        t('features.imageGen.b1', 'Generate images from post content'),
        t('features.imageGen.b2', 'Multiple style options and aspect ratios'),
        t('features.imageGen.b3', 'Optimized for each platform'),
        t('features.imageGen.b4', 'Text overlay and branding options'),
      ],
      gradient: 'from-fuchsia-500 to-[var(--color-accent-magenta)]',
      reverse: true,
      mockup: <ImageGenMockup />,
    },
    {
      icon: FileText,
      title: t('features.templates.title', 'Template Library'),
      description: t(
        'features.templates.desc',
        'Start with battle-tested templates for every content type: listicles, stories, hot takes, tutorials, case studies, and more. Customize to match your brand.',
      ),
      benefits: [
        t('features.templates.b1', '50+ professional templates'),
        t('features.templates.b2', 'Categorized by content type and platform'),
        t('features.templates.b3', 'Fill variables and generate reusable drafts'),
        t('features.templates.b4', 'Reuse proven frameworks across campaigns'),
      ],
      gradient: 'from-teal-500 to-[var(--color-accent-cyan)]',
      mockup: <TemplatesMockup />,
    },
    {
      icon: Hash,
      title: t('features.hashtags.title', 'Hashtag Research'),
      description: t(
        'features.hashtags.desc',
        'Find the perfect hashtags to maximize your reach. Get trending, niche, and engagement-optimized hashtag suggestions for every post.',
      ),
      benefits: [
        t('features.hashtags.b1', 'Trending hashtag suggestions'),
        t('features.hashtags.b2', 'Niche-specific recommendations'),
        t('features.hashtags.b3', 'Optimal hashtag count per platform'),
        t('features.hashtags.b4', 'Save hashtag sets for reuse'),
      ],
      gradient: 'from-sky-500 to-[var(--color-accent-blue)]',
      reverse: true,
      mockup: <HashtagMockup />,
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--color-void)]" />
        <div className="absolute inset-0 mesh-gradient opacity-40" />
        <div className="absolute inset-0 grid-pattern" />

        <div className="orb w-72 h-72 top-[10%] right-[5%] bg-[var(--color-accent-violet)]/15" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="heading-lg text-white mb-6 animate-fade-in-up">
            {t('features.title', 'Every Tool You')}{' '}
            <span className="gradient-text-brand">{t('features.titleHighlight', 'Need')}</span>
          </h1>
          <p
            className="text-lg text-[var(--color-text-secondary)] max-w-3xl mx-auto animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            {t(
              'features.subtitle',
              'Explore every tool and feature that makes PostCommander the most complete AI social media assistant.',
            )}
          </p>
        </div>
      </section>

      {/* Feature sections */}
      {features.map((feature, i) => (
        <section
          key={feature.title}
          className={clsx(
            'relative py-24 overflow-hidden',
            i % 2 === 0 ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-void)]',
          )}
        >
          {/* Subtle background orb that changes per section */}
          <div
            className="orb w-96 h-96 opacity-30"
            style={{
              top: '20%',
              [feature.reverse ? 'left' : 'right']: '-10%',
              background: `var(--color-accent-${['blue', 'violet', 'magenta', 'cyan', 'emerald'][i % 5]})`,
              filter: 'blur(120px)',
            }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FeatureDetail {...feature} />
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--color-void)]" />
        <div className="absolute inset-0 mesh-gradient opacity-50" />

        <div className="orb w-72 h-72 top-[10%] left-[10%] bg-[var(--color-accent-blue)]/15" />
        <div
          className="orb w-56 h-56 bottom-[10%] right-[15%] bg-[var(--color-accent-magenta)]/10"
          style={{ animationDelay: '7s' }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-lg text-white mb-6 animate-fade-in-up">
            {t('features.ctaTitle', 'Ready to Try All These Features?')}
          </h2>
          <p
            className="text-lg text-[var(--color-text-secondary)] mb-10 max-w-2xl mx-auto animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            {t(
              'features.ctaSubtitle',
              'Start with the Free plan and explore. Upgrade to unlock everything.',
            )}
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            <Link to="/app" className="btn-primary-glow !text-lg !px-10 !py-5">
              {t('features.ctaButton', 'Get Started Free')}
              <ArrowRight size={22} />
            </Link>
            <Link to="/pricing" className="btn-ghost-glow !text-lg !px-10 !py-5">
              {t('features.ctaPricing', 'View Pricing')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
