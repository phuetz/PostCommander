import { useTranslation } from 'react-i18next';
import { BookOpen, Clock, Send, Calendar, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';

/* ------------------------------------------------------------------ */
/*  Article Data                                                        */
/* ------------------------------------------------------------------ */
function useArticlesData() {
  const { t } = useTranslation();

  const categories: Record<string, { label: string; color: string }> = {
    tutorial: {
      label: t('marketing.blog.catTutorial', 'Tutorial'),
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    strategy: {
      label: t('marketing.blog.catStrategy', 'Strategy'),
      color: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    },
    industry: {
      label: t('marketing.blog.catIndustry', 'Industry'),
      color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    },
    caseStudy: {
      label: t('marketing.blog.catCaseStudy', 'Case Study'),
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    tips: {
      label: t('marketing.blog.catTips', 'Tips'),
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
  };

  const featured = {
    title: t(
      'marketing.blog.featuredTitle',
      'The Ultimate Guide to AI-Powered Social Media in 2026',
    ),
    excerpt: t(
      'marketing.blog.featuredExcerpt',
      'Everything you need to know about leveraging artificial intelligence for social media content creation. From choosing the right AI model to crafting prompts that generate viral content — this comprehensive guide covers it all.',
    ),
    date: t('marketing.blog.featuredDate', 'March 5, 2026'),
    readTime: t('marketing.blog.featuredReadTime', '12 min read'),
    category: categories.strategy,
    author: {
      name: t('marketing.blog.featuredAuthor', 'Sophie Laurent'),
      initials: 'SL',
    },
  };

  const articles = [
    {
      title: t('marketing.blog.article1Title', 'How to 10x Your LinkedIn Engagement with AI Hooks'),
      excerpt: t(
        'marketing.blog.article1Excerpt',
        'Learn the proven hook formulas that top LinkedIn creators use to stop the scroll and drive massive engagement on every post.',
      ),
      date: t('marketing.blog.article1Date', 'March 3, 2026'),
      readTime: t('marketing.blog.article1ReadTime', '6 min read'),
      category: categories.tutorial,
      author: { name: t('marketing.blog.article1Author', 'Aisha Khan'), initials: 'AK' },
    },
    {
      title: t(
        'marketing.blog.article2Title',
        'Content Pillars: The Strategy Framework Top Creators Use',
      ),
      excerpt: t(
        'marketing.blog.article2Excerpt',
        'Discover how to structure your content around strategic pillars that build authority and keep your audience coming back for more.',
      ),
      date: t('marketing.blog.article2Date', 'February 28, 2026'),
      readTime: t('marketing.blog.article2ReadTime', '8 min read'),
      category: categories.strategy,
      author: { name: t('marketing.blog.article2Author', 'Marc Rousseau'), initials: 'MR' },
    },
    {
      title: t(
        'marketing.blog.article3Title',
        '5 AI Models Compared: Which One Writes the Best Posts?',
      ),
      excerpt: t(
        'marketing.blog.article3Excerpt',
        'We tested OpenAI, Claude, Gemini, Mistral, and Ollama across 500 posts. Here are the surprising results and when to use each model.',
      ),
      date: t('marketing.blog.article3Date', 'February 24, 2026'),
      readTime: t('marketing.blog.article3ReadTime', '10 min read'),
      category: categories.industry,
      author: { name: t('marketing.blog.article3Author', 'Sophie Laurent'), initials: 'SL' },
    },
    {
      title: t(
        'marketing.blog.article4Title',
        'From 0 to 10K Followers: A PostCommander Case Study',
      ),
      excerpt: t(
        'marketing.blog.article4Excerpt',
        'How freelance designer Jordan Ellis grew from zero to 10,000 followers in 90 days using AI-powered content creation.',
      ),
      date: t('marketing.blog.article4Date', 'February 20, 2026'),
      readTime: t('marketing.blog.article4ReadTime', '7 min read'),
      category: categories.caseStudy,
      author: { name: t('marketing.blog.article4Author', 'Aisha Khan'), initials: 'AK' },
    },
    {
      title: t(
        'marketing.blog.article5Title',
        'The Science of Viral Posts: What Makes Content Spread',
      ),
      excerpt: t(
        'marketing.blog.article5Excerpt',
        'Analyzing 10,000 viral posts to uncover the patterns, emotions, and structures that make social media content go viral.',
      ),
      date: t('marketing.blog.article5Date', 'February 15, 2026'),
      readTime: t('marketing.blog.article5ReadTime', '9 min read'),
      category: categories.strategy,
      author: { name: t('marketing.blog.article5Author', 'Marc Rousseau'), initials: 'MR' },
    },
    {
      title: t('marketing.blog.article6Title', 'Carousel Posts That Convert: A Step-by-Step Guide'),
      excerpt: t(
        'marketing.blog.article6Excerpt',
        'Master the art of creating carousel posts that educate, engage, and convert. Includes templates and real-world examples.',
      ),
      date: t('marketing.blog.article6Date', 'February 10, 2026'),
      readTime: t('marketing.blog.article6ReadTime', '6 min read'),
      category: categories.tutorial,
      author: { name: t('marketing.blog.article6Author', 'Sophie Laurent'), initials: 'SL' },
    },
    {
      title: t(
        'marketing.blog.article7Title',
        'Repurposing Mastery: One Idea, Six Platforms, 10x Reach',
      ),
      excerpt: t(
        'marketing.blog.article7Excerpt',
        'Stop creating from scratch for every platform. Learn the framework for turning one content idea into six platform-optimized posts.',
      ),
      date: t('marketing.blog.article7Date', 'February 5, 2026'),
      readTime: t('marketing.blog.article7ReadTime', '5 min read'),
      category: categories.tips,
      author: { name: t('marketing.blog.article7Author', 'Aisha Khan'), initials: 'AK' },
    },
    {
      title: t('marketing.blog.article8Title', 'Why Your Hooks Are Failing (And How to Fix Them)'),
      excerpt: t(
        'marketing.blog.article8Excerpt',
        'The 5 most common hook mistakes that kill engagement, plus the 8 proven hook strategies that capture attention every time.',
      ),
      date: t('marketing.blog.article8Date', 'January 30, 2026'),
      readTime: t('marketing.blog.article8ReadTime', '7 min read'),
      category: categories.tips,
      author: { name: t('marketing.blog.article8Author', 'Marc Rousseau'), initials: 'MR' },
    },
    {
      title: t(
        'marketing.blog.article9Title',
        'The 2026 Social Media Algorithm Update: What Changed',
      ),
      excerpt: t(
        'marketing.blog.article9Excerpt',
        'A deep dive into the latest algorithm changes across LinkedIn, X, Instagram, and TikTok — and what they mean for your content strategy.',
      ),
      date: t('marketing.blog.article9Date', 'January 25, 2026'),
      readTime: t('marketing.blog.article9ReadTime', '11 min read'),
      category: categories.industry,
      author: { name: t('marketing.blog.article9Author', 'Sophie Laurent'), initials: 'SL' },
    },
  ];

  return { featured, articles, categories };
}

/* ------------------------------------------------------------------ */
/*  Hero Section                                                        */
/* ------------------------------------------------------------------ */
function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative pt-28 pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 grid-pattern" />

      <div className="orb w-72 h-72 top-[10%] right-[10%] bg-[var(--color-accent-blue)]/20" />
      <div
        className="orb w-56 h-56 top-[60%] left-[5%] bg-[var(--color-accent-violet)]/15"
        style={{ animationDelay: '5s' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-fade-in-up animate-glow-pulse mb-8">
          <BookOpen size={14} className="text-[var(--color-accent-cyan)]" />
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide uppercase">
            {t('marketing.blog.heroBadge', 'Resources & Insights')}
          </span>
        </div>

        <h1 className="heading-lg mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <span className="text-white block">{t('marketing.blog.heroTitle1', 'Resources &')}</span>
          <span className="gradient-text-cool block">
            {t('marketing.blog.heroTitle2', 'Insights')}
          </span>
        </h1>

        <p
          className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          {t(
            'marketing.blog.heroSubtitle',
            'Learn how to dominate social media with AI. Tips, strategies, case studies, and industry insights from the PostCommander team.',
          )}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Featured Article                                                    */
/* ------------------------------------------------------------------ */
function FeaturedArticle() {
  const { featured } = useArticlesData();
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

  return (
    <section className="relative py-8 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="glass-card rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.005] animate-fade-in-up"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            boxShadow: hovered
              ? '0 0 60px var(--color-glow-blue), 0 0 120px var(--color-glow-violet)'
              : undefined,
          }}
        >
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Image placeholder */}
            <div className="relative h-64 lg:h-auto min-h-[300px] overflow-hidden">
              <div className="absolute inset-0 mesh-gradient" />
              <div className="absolute inset-0 grid-pattern opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Sparkles size={48} className="text-white/20 mx-auto mb-4" />
                  <span className="text-sm text-white/30 font-display uppercase tracking-wider">
                    {t('marketing.blog.featuredImagePlaceholder', 'Featured Article')}
                  </span>
                </div>
              </div>
              {/* Coming Soon badge on hover */}
              <div
                className={clsx(
                  'absolute top-4 right-4 px-3 py-1 rounded-full glass text-xs font-medium text-white transition-opacity duration-300',
                  hovered ? 'opacity-100' : 'opacity-0',
                )}
              >
                {t('marketing.blog.comingSoon', 'Coming Soon')}
              </div>
            </div>

            {/* Content */}
            <div className="p-8 lg:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={clsx(
                    'inline-flex px-3 py-1 rounded-full text-xs font-semibold border',
                    featured.category.color,
                  )}
                >
                  {featured.category.label}
                </span>
                <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                  <Calendar size={12} />
                  {featured.date}
                </span>
                <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                  <Clock size={12} />
                  {featured.readTime}
                </span>
              </div>

              <h2 className="heading-md text-white mb-4 group-hover:gradient-text-brand transition-all duration-300">
                {featured.title}
              </h2>

              <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
                {featured.excerpt}
              </p>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-accent-blue)] to-[var(--color-accent-violet)] flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{featured.author.initials}</span>
                </div>
                <span className="text-sm text-white font-medium">{featured.author.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Article Grid                                                        */
/* ------------------------------------------------------------------ */
function ArticleGrid() {
  const { articles } = useArticlesData();

  return (
    <section className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 dot-pattern" />
      <div
        className="orb w-64 h-64 top-[30%] right-[5%] bg-[var(--color-accent-magenta)]/10"
        style={{ animationDelay: '3s' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, i) => (
            <ArticleCard key={i} article={article} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ArticleCard({
  article,
  index,
}: {
  article: {
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
    category: { label: string; color: string };
    author: { name: string; initials: string };
  };
  index: number;
}) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="glass-card rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-1 animate-fade-in-up relative"
      style={{ animationDelay: `${0.1 + index * 0.05}s` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Coming Soon badge on hover */}
      <div
        className={clsx(
          'absolute top-4 right-4 z-10 px-3 py-1 rounded-full glass text-xs font-medium text-white transition-opacity duration-300',
          hovered ? 'opacity-100' : 'opacity-0',
        )}
      >
        {t('marketing.blog.comingSoon', 'Coming Soon')}
      </div>

      {/* Image placeholder */}
      <div className="relative h-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-surface-raised)] to-[var(--color-surface-overlay)]" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen size={24} className="text-white/10" />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={clsx(
              'inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold border',
              article.category.color,
            )}
          >
            {article.category.label}
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
            <Clock size={10} />
            {article.readTime}
          </span>
        </div>

        <h3 className="heading-sm text-white mb-2 text-base group-hover:text-[var(--color-accent-blue)] transition-colors duration-200 line-clamp-2">
          {article.title}
        </h3>

        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4 line-clamp-3">
          {article.excerpt}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-accent-violet)] to-[var(--color-accent-magenta)] flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">{article.author.initials}</span>
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">{article.author.name}</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)]">{article.date}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Newsletter CTA                                                      */
/* ------------------------------------------------------------------ */
function NewsletterCTA() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute inset-0 mesh-gradient opacity-30" />
      <div
        className="orb w-56 h-56 top-[30%] left-[20%] bg-[var(--color-accent-blue)]/10"
        style={{ animationDelay: '2s' }}
      />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 sm:p-12 rounded-2xl text-center animate-fade-in-up">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-accent-blue)] to-[var(--color-accent-violet)] flex items-center justify-center mx-auto mb-6">
            <Send size={24} className="text-white" />
          </div>

          <h2 className="heading-md text-white mb-3">
            {t('marketing.blog.newsletterTitle', 'Stay in the Loop')}
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-8">
            {t(
              'marketing.blog.newsletterSubtitle',
              'Get weekly tips on AI content creation, platform updates, and growth strategies delivered to your inbox.',
            )}
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('marketing.blog.emailPlaceholder', 'your@email.com')}
              className="flex-1 px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-violet)]/50 transition-all"
              required
            />
            <button
              type="submit"
              className="btn-primary-glow !px-6 !py-3 !rounded-xl !text-sm whitespace-nowrap"
            >
              {subscribed
                ? t('marketing.blog.subscribed', 'Subscribed!')
                : t('marketing.blog.subscribe', 'Subscribe')}
            </button>
          </form>

          <p className="text-xs text-[var(--color-text-muted)] mt-4">
            {t('marketing.blog.noSpam', 'No spam, unsubscribe anytime. We respect your inbox.')}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Blog Page                                                           */
/* ------------------------------------------------------------------ */
export function BlogPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <HeroSection />
      <FeaturedArticle />
      <ArticleGrid />
      <NewsletterCTA />
    </>
  );
}
