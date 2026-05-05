import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  Send,
  CalendarClock,
  ArrowRight,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Music,
  Pin,
  CheckCircle2,
  XCircle,
  Flame,
  Zap,
  Layers,
  RefreshCw,
  Hash,
  Clock,
  TrendingUp,
  AlertCircle,
  Video,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { usePosts } from '@/hooks/usePosts';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useTemplates } from '@/hooks/useTemplates';
import { useAnalyticsOverview } from '@/hooks/useAnalytics';
import { PLATFORMS, type PlatformId } from '@postcommander/shared';
import { format } from 'date-fns';

const platformIcons: Record<PlatformId, React.ElementType> = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Music,
  pinterest: Pin,
};

const statusBadge: Record<string, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; labelKey: string; defaultLabel: string }> = {
  draft: { variant: 'default', labelKey: 'dashboard.status.draft', defaultLabel: 'Draft' },
  published: { variant: 'success', labelKey: 'dashboard.status.published', defaultLabel: 'Published' },
  scheduled: { variant: 'info', labelKey: 'dashboard.status.scheduled', defaultLabel: 'Scheduled' },
  failed: { variant: 'danger', labelKey: 'dashboard.status.failed', defaultLabel: 'Failed' },
};

const toolCards = [
  {
    to: '/app/viral',
    icon: Flame,
    labelKey: 'dashboard.tools.viral',
    defaultLabel: 'Viral Library',
    descKey: 'dashboard.tools.viralDesc',
    defaultDesc: 'Browse top-performing posts',
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  },
  {
    to: '/app/hooks',
    icon: Zap,
    labelKey: 'dashboard.tools.hooks',
    defaultLabel: 'Hook Generator',
    descKey: 'dashboard.tools.hooksDesc',
    defaultDesc: 'Craft attention-grabbing openers',
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  },
  {
    to: '/app/carousel',
    icon: Layers,
    labelKey: 'dashboard.tools.carousel',
    defaultLabel: 'Carousel Maker',
    descKey: 'dashboard.tools.carouselDesc',
    defaultDesc: 'Create carousels & threads',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  },
  {
    to: '/app/templates',
    icon: FileText,
    labelKey: 'dashboard.tools.templates',
    defaultLabel: 'Templates',
    descKey: 'dashboard.tools.templatesDesc',
    defaultDesc: 'Proven post frameworks',
    color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
  },
  {
    to: '/app/video-script',
    icon: Video,
    labelKey: 'dashboard.tools.videoScript',
    defaultLabel: 'Video Scripts',
    descKey: 'dashboard.tools.videoScriptDesc',
    defaultDesc: 'Scripts for TikTok & Reels',
    color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
  },
  {
    to: '/app/repurpose',
    icon: RefreshCw,
    labelKey: 'dashboard.tools.repurpose',
    defaultLabel: 'Repurpose',
    descKey: 'dashboard.tools.repurposeDesc',
    defaultDesc: 'Adapt content across platforms',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  },
  {
    to: '/app/hashtags',
    icon: Hash,
    labelKey: 'dashboard.tools.hashtags',
    defaultLabel: 'Hashtags',
    descKey: 'dashboard.tools.hashtagsDesc',
    defaultDesc: 'Research trending hashtags',
    color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  },
];

export function DashboardPage() {
  const { t } = useTranslation();

  const postsQuery = usePosts({ page: 1, pageSize: 5 });
  const platformsQuery = usePlatforms();
  const templatesQuery = useTemplates({ pageSize: 3 });
  const analyticsQuery = useAnalyticsOverview();

  const posts = postsQuery.data?.data || [];
  const connections = platformsQuery.data || [];
  const popularTemplates = templatesQuery.data?.data || [];
  const analytics = analyticsQuery.data;

  const stats = [
    {
      label: t('dashboard.totalPosts', 'Total Posts'),
      value: analytics?.totalPosts ?? 0,
      icon: FileText,
      color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/30',
    },
    {
      label: t('dashboard.published', 'Published'),
      value: analytics?.byStatus?.published ?? 0,
      icon: Send,
      color: 'text-green-600 bg-green-50 dark:bg-green-900/30',
    },
    {
      label: t('dashboard.failed', 'Failed'),
      value: analytics?.byStatus?.failed ?? 0,
      icon: AlertCircle,
      color: 'text-red-600 bg-red-50 dark:bg-red-900/30',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Welcome + CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('dashboard.welcome', 'Welcome back!')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('dashboard.subtitle', 'Manage your social media posts from one place.')}
          </p>
        </div>
        <Link to="/app/generate">
          <Button icon={<Sparkles size={18} />} size="lg">
            {t('dashboard.quickGenerate', 'Generate a Post')}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {analyticsQuery.isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex items-center gap-4 h-12">
                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800" />
                <div className="space-y-2">
                  <div className="h-6 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
              </div>
            </Card>
          ))
        ) : (
          stats.map((stat) => (
            <Card key={stat.label} hover>
              <div className="flex items-center gap-4">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-xl ${stat.color}`}
                >
                  <stat.icon size={22} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Quick Access Tools */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-brand-600" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {t('dashboard.quickTools', 'Quick Access Tools')}
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {toolCards.map((tool) => (
            <Link key={tool.to} to={tool.to}>
              <Card
                hover
                padding="sm"
                className="group text-center h-full"
              >
                <div className="flex flex-col items-center gap-2.5 py-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tool.color} group-hover:scale-110 transition-transform duration-200`}>
                    <tool.icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {t(tool.labelKey, tool.defaultLabel)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                      {t(tool.descKey, tool.defaultDesc)}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Posts */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {t('dashboard.recentPosts', 'Recent Posts')}
              </h3>
              <Link
                to="/app/history"
                className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium inline-flex items-center gap-1"
              >
                {t('dashboard.viewAll', 'View all')}
                <ArrowRight size={14} />
              </Link>
            </div>

            {postsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 px-5">
                <FileText
                  size={40}
                  className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
                />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {t('dashboard.noPosts', 'No posts yet. Generate your first one!')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {posts.map((post) => {
                  const badge = statusBadge[post.status] || statusBadge.draft;
                  return (
                    <div
                      key={post.id}
                      className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {post.originalPrompt || post.content.slice(0, 80)}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center gap-1">
                            {post.platforms.map((pid) => {
                              const Icon = platformIcons[pid as PlatformId];
                              return Icon ? (
                                <Icon
                                  key={pid}
                                  size={12}
                                  className="text-gray-400"
                                />
                              ) : null;
                            })}
                          </div>
                          <span className="text-xs text-gray-400">
                            {format(new Date(post.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <Badge variant={badge.variant}>{t(badge.labelKey, badge.defaultLabel)}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Popular Templates */}
          {popularTemplates.length > 0 && (
            <Card padding="none">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FileText size={16} className="text-teal-500" />
                  {t('dashboard.popularTemplates', 'Popular Templates')}
                </h3>
                <Link
                  to="/app/templates"
                  className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium inline-flex items-center gap-1"
                >
                  {t('dashboard.viewAll', 'View all')}
                  <ArrowRight size={14} />
                </Link>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {popularTemplates.map((tpl) => (
                  <Link
                    key={tpl.id}
                    to={`/app/templates?id=${tpl.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {tpl.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {tpl.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge variant="default">{tpl.category}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Platform Connections */}
          <Card padding="none">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {t('dashboard.platforms', 'Platforms')}
              </h3>
            </div>

            {platformsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="sm" />
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {(Object.keys(PLATFORMS) as PlatformId[]).map((pid) => {
                  const platform = PLATFORMS[pid];
                  const Icon = platformIcons[pid];
                  const connection = connections.find(
                    (c) => c.id.includes(pid) || c.platform === pid,
                  );
                  const isConnected = connection?.connected || false;

                  return (
                    <div
                      key={pid}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: platform.color }}
                        >
                          <Icon size={16} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {platform.name}
                        </span>
                      </div>
                      {isConnected ? (
                        <CheckCircle2
                          size={18}
                          className="text-green-500"
                        />
                      ) : (
                        <XCircle
                          size={18}
                          className="text-gray-300 dark:text-gray-600"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800">
              <Link
                to="/app/settings"
                className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
              >
                {t('dashboard.manageConnections', 'Manage connections')}
              </Link>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card padding="none">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                {t('dashboard.recentActivity', 'Recent Activity')}
              </h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {posts.length === 0 ? (
                <div className="text-center py-8 px-5">
                  <p className="text-sm text-gray-400">
                    {t('dashboard.noActivity', 'No recent activity')}
                  </p>
                </div>
              ) : (
                posts.slice(0, 4).map((post) => {
                  const actionLabel =
                    post.status === 'published'
                      ? t('dashboard.activityPublished', 'Published a post')
                      : post.status === 'scheduled'
                        ? t('dashboard.activityScheduled', 'Scheduled a post')
                        : t('dashboard.activityDrafted', 'Created a draft');
                  const actionIcon =
                    post.status === 'published' ? Send :
                    post.status === 'scheduled' ? CalendarClock : FileText;
                  const ActionIcon = actionIcon;

                  return (
                    <div
                      key={`activity-${post.id}`}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <ActionIcon size={13} className="text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {actionLabel}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {post.originalPrompt || post.content.slice(0, 50)}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {format(new Date(post.createdAt), 'MMM d')}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
