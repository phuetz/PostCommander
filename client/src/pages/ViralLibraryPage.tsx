import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Music,
  Pin,
  Filter,
  TrendingUp,
  Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { useViralPosts, useViralCategories, useSearchViralPosts } from '@/hooks/useViral';
import type { ViralPost } from '@/services/api';

const platformIcons: Record<string, React.ElementType> = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Music,
  pinterest: Pin,
};

const platformColors: Record<string, string> = {
  linkedin: '#0A66C2',
  twitter: '#000000',
  facebook: '#1877F2',
  instagram: '#E4405F',
  tiktok: '#000000',
  pinterest: '#BD081C',
};

const platformTabs = [
  { id: 'all', label: 'All' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'twitter', label: 'X / Twitter' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
];

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function ViralLibraryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlatform, setActivePlatform] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPost, setSelectedPost] = useState<ViralPost | null>(null);

  const postsQuery = useViralPosts({
    platform: activePlatform === 'all' ? undefined : activePlatform,
    category: selectedCategory || undefined,
    pageSize: 30,
  });

  const categoriesQuery = useViralCategories();
  const searchResults = useSearchViralPosts(searchQuery);

  const posts = useMemo((): ViralPost[] => {
    if (searchQuery.length >= 3 && searchResults.data) {
      return searchResults.data;
    }
    return postsQuery.data?.data || [];
  }, [searchQuery, searchResults.data, postsQuery.data]);

  const categories = categoriesQuery.data || [];
  const isLoading = postsQuery.isLoading || (searchQuery.length >= 3 && searchResults.isLoading);

  const categoryOptions = [
    { value: '', label: t('viral.allCategories', 'All Categories') },
    ...categories.map((c) => ({ value: c, label: c })),
  ];

  const handleUseAsInspiration = (post: ViralPost) => {
    navigate('/app/generate', { state: { prompt: post.content.slice(0, 200) } });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('viral.title', 'Viral Library')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('viral.subtitle', 'Browse top-performing posts for inspiration')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-brand-600" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {posts.length} {t('viral.postsFound', 'posts')}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                icon={<Search size={16} />}
                placeholder={t('viral.searchPlaceholder', 'Search viral posts...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="sm:w-48">
              <Select
                options={categoryOptions}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              />
            </div>
          </div>

          {/* Platform tabs */}
          <div className="flex flex-wrap gap-2">
            {platformTabs.map((tab) => {
              const isActive = activePlatform === tab.id;
              const Icon = tab.id !== 'all' ? platformIcons[tab.id] : Filter;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePlatform(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {Icon && <Icon size={14} />}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Results Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <TrendingUp size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('viral.noResults', 'No viral posts found')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {t('viral.noResultsDesc', 'Try adjusting your filters or search terms')}
            </p>
          </div>
        </Card>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {posts.map((post) => {
            const PlatformIcon = platformIcons[post.platform] || Sparkles;
            const platformColor = platformColors[post.platform] || '#6366f1';

            return (
              <div key={post.id} className="break-inside-avoid">
                <Card hover padding="none" className="group cursor-pointer overflow-hidden">
                  <div onClick={() => setSelectedPost(post)} className="p-4 space-y-3">
                    {/* Platform & Author */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: platformColor }}
                        >
                          <PlatformIcon size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {post.author || post.authorName}
                          </p>
                          <p className="text-xs text-gray-400">@{post.authorHandle}</p>
                        </div>
                      </div>
                      <Badge variant="info">{post.category}</Badge>
                    </div>

                    {/* Content Preview */}
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-6">
                      {post.content}
                    </p>

                    {/* Engagement Stats */}
                    <div className="flex items-center gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Heart size={13} className="text-red-400" />
                        <span>{formatNumber(post.likes)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <MessageCircle size={13} className="text-blue-400" />
                        <span>{formatNumber(post.comments)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Share2 size={13} className="text-green-400" />
                        <span>{formatNumber(post.shares)}</span>
                      </div>
                    </div>

                    {/* Hover CTA */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors">
                        <Eye size={13} />
                        {t('viral.viewPost', 'View full post')}
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Detail Modal */}
      <Modal
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        title={selectedPost?.author || selectedPost?.authorName || ''}
        maxWidth="lg"
      >
        {selectedPost && (
          <div className="space-y-5">
            {/* Author info */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{
                  backgroundColor: platformColors[selectedPost.platform] || '#6366f1',
                }}
              >
                {(() => {
                  const Icon = platformIcons[selectedPost.platform] || Sparkles;
                  return <Icon size={18} />;
                })()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedPost.author || selectedPost.authorName}
                </p>
                <p className="text-sm text-gray-500">@{selectedPost.authorHandle}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Badge variant="info">{selectedPost.category}</Badge>
                <Badge>{selectedPost.platform}</Badge>
              </div>
            </div>

            {/* Full content */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                {selectedPost.content}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 py-3 border-t border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-red-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatNumber(selectedPost.likes)}
                </span>
                <span className="text-xs text-gray-500">{t('viral.likes', 'likes')}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle size={16} className="text-blue-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatNumber(selectedPost.comments)}
                </span>
                <span className="text-xs text-gray-500">{t('viral.comments', 'comments')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Share2 size={16} className="text-green-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatNumber(selectedPost.shares)}
                </span>
                <span className="text-xs text-gray-500">{t('viral.shares', 'shares')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                icon={<Sparkles size={16} />}
                onClick={() => {
                  setSelectedPost(null);
                  handleUseAsInspiration(selectedPost);
                }}
              >
                {t('viral.useAsInspiration', 'Use as Inspiration')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(selectedPost.content);
                }}
              >
                {t('post.copy', 'Copy')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
