import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Megaphone,
  Rocket,
  Building2,
  GraduationCap,
  Briefcase,
  Users,
  RefreshCw,
  LayoutGrid,
  Palette,
  FileText,
  Zap,
  BarChart3,
  TrendingUp,
  Hash,
  Target,
  Sparkles,
  Globe,
  Star,
  Quote,
} from 'lucide-react';
import { useEffect } from 'react';
import clsx from 'clsx';

/* ------------------------------------------------------------------ */
/*  Use Case Data                                                       */
/* ------------------------------------------------------------------ */
function useUseCasesData() {
  const { t } = useTranslation();

  return [
    {
      id: 'creators',
      icon: Megaphone,
      color: 'var(--color-accent-blue)',
      orbColor: 'bg-[var(--color-accent-blue)]/10',
      title: t('marketing.useCases.creatorsTitle', 'Content Creators & Influencers'),
      problem: t(
        'marketing.useCases.creatorsProblem',
        'Maintaining an active presence across 6 platforms is exhausting. Each platform needs different formatting, different tone, different hashtags. You spend more time adapting content than creating it.',
      ),
      solution: t(
        'marketing.useCases.creatorsSolution',
        'Generate platform-optimized content from a single idea. PostCommander understands the nuances of each platform and adapts your voice accordingly — from LinkedIn thought leadership to TikTok hooks.',
      ),
      features: [
        { icon: RefreshCw, label: t('marketing.useCases.creatorsF1', 'Content Repurposing Engine') },
        { icon: LayoutGrid, label: t('marketing.useCases.creatorsF2', 'Carousel & Thread Creator') },
        { icon: Palette, label: t('marketing.useCases.creatorsF3', 'Writing Style Cloning') },
      ],
      testimonial: {
        quote: t(
          'marketing.useCases.creatorsQuote',
          'I went from spending 4 hours a day on social media to 30 minutes. PostCommander writes in my exact voice — my followers can\'t tell the difference.',
        ),
        author: t('marketing.useCases.creatorsAuthor', 'Alex Rivera'),
        role: t('marketing.useCases.creatorsRole', 'Creator, 85K followers'),
      },
      mockFeatures: [
        t('marketing.useCases.creatorsMock1', 'LinkedIn → Professional insight'),
        t('marketing.useCases.creatorsMock2', 'X → Punchy thread (8 tweets)'),
        t('marketing.useCases.creatorsMock3', 'Instagram → Carousel (10 slides)'),
        t('marketing.useCases.creatorsMock4', 'TikTok → Hook-driven script'),
      ],
    },
    {
      id: 'startups',
      icon: Rocket,
      color: 'var(--color-accent-violet)',
      orbColor: 'bg-[var(--color-accent-violet)]/10',
      title: t('marketing.useCases.startupsTitle', 'Startup Founders & SaaS Builders'),
      problem: t(
        'marketing.useCases.startupsProblem',
        'Building in public requires consistent updates, but you\'re already wearing 10 hats. Marketing feels like a luxury when there\'s product to ship.',
      ),
      solution: t(
        'marketing.useCases.startupsSolution',
        'Transform product updates, milestone celebrations, and industry insights into engaging posts that build your personal brand and attract users, investors, and talent.',
      ),
      features: [
        { icon: FileText, label: t('marketing.useCases.startupsF1', 'Startup Templates Library') },
        { icon: Zap, label: t('marketing.useCases.startupsF2', 'AI Hook Generator') },
        { icon: Target, label: t('marketing.useCases.startupsF3', 'LinkedIn Optimization') },
      ],
      testimonial: {
        quote: t(
          'marketing.useCases.startupsQuote',
          'PostCommander helped me turn our weekly changelog into viral LinkedIn posts. Our inbound leads doubled in the first month.',
        ),
        author: t('marketing.useCases.startupsAuthor', 'Priya Sharma'),
        role: t('marketing.useCases.startupsRole', 'Founder, DevSync'),
      },
      mockFeatures: [
        t('marketing.useCases.startupsMock1', 'Product Update → Launch post'),
        t('marketing.useCases.startupsMock2', 'Milestone → Celebration thread'),
        t('marketing.useCases.startupsMock3', 'Lesson Learned → Thought piece'),
        t('marketing.useCases.startupsMock4', 'Hiring → Job post optimized'),
      ],
    },
    {
      id: 'agencies',
      icon: Building2,
      color: 'var(--color-accent-magenta)',
      orbColor: 'bg-[var(--color-accent-magenta)]/10',
      title: t('marketing.useCases.agenciesTitle', 'Marketing Agencies'),
      problem: t(
        'marketing.useCases.agenciesProblem',
        'Managing 10+ client accounts across multiple platforms means hundreds of posts per week. Each client has a unique voice, and quality can\'t slip even at scale.',
      ),
      solution: t(
        'marketing.useCases.agenciesSolution',
        'Clone each client\'s writing style, generate platform-specific content at scale, and use A/B testing with engagement prediction to deliver measurable results.',
      ),
      features: [
        { icon: Palette, label: t('marketing.useCases.agenciesF1', 'Per-Client Style Cloning') },
        { icon: BarChart3, label: t('marketing.useCases.agenciesF2', 'A/B Testing & Prediction') },
        { icon: Globe, label: t('marketing.useCases.agenciesF3', 'Multi-Platform at Scale') },
      ],
      testimonial: {
        quote: t(
          'marketing.useCases.agenciesQuote',
          'We manage 15 client accounts with a team of 3. PostCommander\'s style cloning ensures every post sounds authentically like our clients.',
        ),
        author: t('marketing.useCases.agenciesAuthor', 'Thomas Berger'),
        role: t('marketing.useCases.agenciesRole', 'Director, Nexus Social Agency'),
      },
      mockFeatures: [
        t('marketing.useCases.agenciesMock1', 'Client A → Tech startup voice'),
        t('marketing.useCases.agenciesMock2', 'Client B → Luxury brand tone'),
        t('marketing.useCases.agenciesMock3', 'Client C → Casual lifestyle'),
        t('marketing.useCases.agenciesMock4', 'A/B variants → Predicted 87% lift'),
      ],
    },
    {
      id: 'coaches',
      icon: GraduationCap,
      color: 'var(--color-accent-cyan)',
      orbColor: 'bg-[var(--color-accent-cyan)]/10',
      title: t('marketing.useCases.coachesTitle', 'Coaches & Consultants'),
      problem: t(
        'marketing.useCases.coachesProblem',
        'Establishing thought leadership demands consistent, high-value posting. But between client sessions and course creation, there\'s barely time to think about social media.',
      ),
      solution: t(
        'marketing.useCases.coachesSolution',
        'Turn your expertise into a steady stream of thought leadership content. Draw from viral patterns, trending topics, and your unique perspective to build authority.',
      ),
      features: [
        { icon: Star, label: t('marketing.useCases.coachesF1', 'Viral Post Library') },
        { icon: TrendingUp, label: t('marketing.useCases.coachesF2', 'Content Pillars Strategy') },
        { icon: Sparkles, label: t('marketing.useCases.coachesF3', 'Trending Topics Discovery') },
      ],
      testimonial: {
        quote: t(
          'marketing.useCases.coachesQuote',
          'I went from posting once a week to daily — and my coaching inquiries tripled. The AI captures my teaching style perfectly.',
        ),
        author: t('marketing.useCases.coachesAuthor', 'Dr. Maria Chen'),
        role: t('marketing.useCases.coachesRole', 'Executive Coach & Speaker'),
      },
      mockFeatures: [
        t('marketing.useCases.coachesMock1', 'Leadership tip → 5-part thread'),
        t('marketing.useCases.coachesMock2', 'Client win → Case study post'),
        t('marketing.useCases.coachesMock3', 'Book quote → Insight carousel'),
        t('marketing.useCases.coachesMock4', 'Trending topic → Hot take'),
      ],
    },
    {
      id: 'freelancers',
      icon: Briefcase,
      color: 'var(--color-accent-emerald)',
      orbColor: 'bg-[var(--color-accent-emerald)]/10',
      title: t('marketing.useCases.freelancersTitle', 'Freelancers & Solopreneurs'),
      problem: t(
        'marketing.useCases.freelancersProblem',
        'When you\'re wearing every hat — developer, designer, accountant, marketer — social media marketing always falls to the bottom of the priority list.',
      ),
      solution: t(
        'marketing.useCases.freelancersSolution',
        'Maintain a professional social media presence with minimal effort. Generate weeks of content in one sitting using templates and quick generation tools.',
      ),
      features: [
        { icon: FileText, label: t('marketing.useCases.freelancersF1', 'Ready-Made Templates') },
        { icon: Zap, label: t('marketing.useCases.freelancersF2', 'Quick One-Click Generation') },
        { icon: Globe, label: t('marketing.useCases.freelancersF3', 'All 6 Platforms Covered') },
      ],
      testimonial: {
        quote: t(
          'marketing.useCases.freelancersQuote',
          'I batch-create a month of content in one afternoon. PostCommander pays for itself in the first week of saved time.',
        ),
        author: t('marketing.useCases.freelancersAuthor', 'Jordan Ellis'),
        role: t('marketing.useCases.freelancersRole', 'Freelance UX Designer'),
      },
      mockFeatures: [
        t('marketing.useCases.freelancersMock1', 'Portfolio piece → Showcase post'),
        t('marketing.useCases.freelancersMock2', 'New service → Announcement'),
        t('marketing.useCases.freelancersMock3', 'Industry insight → Quick take'),
        t('marketing.useCases.freelancersMock4', 'Availability → Hiring post'),
      ],
    },
    {
      id: 'recruiters',
      icon: Users,
      color: 'var(--color-accent-blue)',
      orbColor: 'bg-[var(--color-accent-blue)]/10',
      title: t('marketing.useCases.recruitersTitle', 'Recruiters & HR'),
      problem: t(
        'marketing.useCases.recruitersProblem',
        'Attracting top talent requires consistent employer branding across platforms. Generic job posts get ignored, and crafting unique employer brand content for each opening is time-consuming.',
      ),
      solution: t(
        'marketing.useCases.recruitersSolution',
        'Create compelling job postings and employer brand content optimized for each platform. Turn company culture, team stories, and open roles into engaging content that attracts the right candidates.',
      ),
      features: [
        { icon: FileText, label: t('marketing.useCases.recruitersF1', 'Recruiting Templates') },
        { icon: Target, label: t('marketing.useCases.recruitersF2', 'LinkedIn-First Optimization') },
        { icon: Hash, label: t('marketing.useCases.recruitersF3', 'Professional Tone Control') },
      ],
      testimonial: {
        quote: t(
          'marketing.useCases.recruitersQuote',
          'Our job posts now get 3x more qualified applicants. The LinkedIn optimization alone was worth switching to PostCommander.',
        ),
        author: t('marketing.useCases.recruitersAuthor', 'Naomi Watkins'),
        role: t('marketing.useCases.recruitersRole', 'Head of Talent, ScaleUp Inc.'),
      },
      mockFeatures: [
        t('marketing.useCases.recruitersMock1', 'Job opening → Engaging post'),
        t('marketing.useCases.recruitersMock2', 'Team event → Culture showcase'),
        t('marketing.useCases.recruitersMock3', 'New hire → Welcome spotlight'),
        t('marketing.useCases.recruitersMock4', 'Company value → Thought piece'),
      ],
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Hero Section                                                        */
/* ------------------------------------------------------------------ */
function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[60vh] flex items-center pt-28 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 grid-pattern" />

      <div className="orb w-72 h-72 top-[15%] left-[10%] bg-[var(--color-accent-violet)]/20" />
      <div className="orb w-96 h-96 top-[50%] right-[5%] bg-[var(--color-accent-blue)]/15" style={{ animationDelay: '5s' }} />
      <div className="orb w-56 h-56 bottom-[10%] left-[30%] bg-[var(--color-accent-magenta)]/10" style={{ animationDelay: '10s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-fade-in-up animate-glow-pulse mb-8">
          <Users size={14} className="text-[var(--color-accent-violet)]" />
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] tracking-wide uppercase">
            {t('marketing.useCases.heroBadge', 'For Every Creator')}
          </span>
        </div>

        <h1 className="heading-lg mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <span className="text-white block">
            {t('marketing.useCases.heroTitle1', 'Built for')}
          </span>
          <span className="gradient-text-brand block">
            {t('marketing.useCases.heroTitle2', 'Every Creator')}
          </span>
        </h1>

        <p
          className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          {t(
            'marketing.useCases.heroSubtitle',
            'Whether you\'re an influencer, startup founder, or marketing agency — PostCommander adapts to your workflow and amplifies your voice.',
          )}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Use Case Section                                                    */
/* ------------------------------------------------------------------ */
function UseCaseSection({
  useCase,
  index,
}: {
  useCase: ReturnType<typeof useUseCasesData>[number];
  index: number;
}) {
  const isEven = index % 2 === 1;

  return (
    <section className="relative py-20 overflow-hidden">
      {index % 2 === 0 && <div className="absolute inset-0 bg-[var(--color-surface)]" />}
      <div className="absolute inset-0 dot-pattern" />
      <div
        className={clsx('orb w-72 h-72', useCase.orbColor)}
        style={{
          top: '30%',
          [isEven ? 'left' : 'right']: '5%',
          animationDelay: `${index * 3}s`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={clsx(
            'grid lg:grid-cols-2 gap-12 lg:gap-16 items-center',
            isEven && 'lg:[direction:rtl] lg:[&>*]:[direction:ltr]',
          )}
        >
          {/* Text Side */}
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${useCase.color}33, ${useCase.color}11)`,
                  border: `1px solid ${useCase.color}33`,
                }}
              >
                <useCase.icon size={22} style={{ color: useCase.color }} />
              </div>
              <h2 className="heading-md text-white">{useCase.title}</h2>
            </div>

            <div className="space-y-6 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-2">
                  The Challenge
                </h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {useCase.problem}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                  The Solution
                </h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {useCase.solution}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Key Features
              </h3>
              {useCase.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <feature.icon size={16} style={{ color: useCase.color }} />
                  <span className="text-sm text-[var(--color-text-secondary)]">{feature.label}</span>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div
              className="glass-card p-5 rounded-xl"
              style={{
                boxShadow: `0 0 30px ${useCase.color}08`,
              }}
            >
              <Quote size={18} className="text-[var(--color-text-muted)] mb-3" />
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed italic mb-3">
                {useCase.testimonial.quote}
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${useCase.color}, ${useCase.color}99)` }}
                >
                  {useCase.testimonial.author
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <p className="text-sm text-white font-medium">{useCase.testimonial.author}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{useCase.testimonial.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mock Card Side */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="glass-card rounded-2xl overflow-hidden">
              {/* Mock title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
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

              {/* Mock content */}
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <useCase.icon size={16} style={{ color: useCase.color }} />
                  <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    {useCase.title}
                  </span>
                </div>

                {/* Mock generation output */}
                <div className="space-y-2">
                  {useCase.mockFeatures.map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: useCase.color }}
                      />
                      <span className="text-xs text-[var(--color-text-secondary)]">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Mock generate button */}
                <div
                  className="w-full py-2.5 rounded-xl text-center text-xs font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${useCase.color}, ${useCase.color}99)`,
                  }}
                >
                  Generate Content
                </div>
              </div>
            </div>
          </div>
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
      <div className="orb w-56 h-56 top-[40%] right-[15%] bg-[var(--color-accent-blue)]/10" style={{ animationDelay: '8s' }} />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="heading-lg text-white mb-6 animate-fade-in-up">
          {t('marketing.useCases.ctaTitle', 'Find Your Perfect Workflow')}
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {t(
            'marketing.useCases.ctaSubtitle',
            'No matter your role or industry, PostCommander adapts to your unique content needs. Start free and see the difference AI-powered content makes.',
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Link to="/app" className="btn-primary-glow">
            {t('marketing.useCases.ctaPrimary', 'Start Free')}
            <ArrowRight size={18} />
          </Link>
          <Link to="/pricing" className="btn-ghost-glow">
            {t('marketing.useCases.ctaSecondary', 'View Pricing')}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Use Cases Page                                                      */
/* ------------------------------------------------------------------ */
export function UseCasesPage() {
  const useCases = useUseCasesData();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <HeroSection />
      {useCases.map((useCase, i) => (
        <UseCaseSection key={useCase.id} useCase={useCase} index={i} />
      ))}
      <CTASection />
    </>
  );
}
