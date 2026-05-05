import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Trash2,
  Send,
  ChevronLeft,
  ChevronRight,
  FileText,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Music,
  Pin,
} from 'lucide-react';
import { format } from 'date-fns';
import { usePosts, useDeletePost, usePublishPost } from '@/hooks/usePosts';
import type { Post, PlatformId, PostStatus } from '@postcommander/shared';
import { PLATFORMS } from '@postcommander/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { CopyButton } from '@/components/post/CopyButton';
import { PostDetailsModal } from '@/components/post/PostDetailsModal';

const platformIcons: Record<PlatformId, React.ElementType> = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Music,
  pinterest: Pin,
};

const statusBadgeMap: Record<
  PostStatus,
  { variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; label: string }
> = {
  draft: { variant: 'default', label: 'Draft' },
  pending_approval: { variant: 'warning', label: 'Pending Approval' },
  approved: { variant: 'success', label: 'Approved' },
  published: { variant: 'success', label: 'Published' },
  scheduled: { variant: 'info', label: 'Scheduled' },
  failed: { variant: 'danger', label: 'Failed' },
};

const PAGE_SIZE = 10;

export function HistoryPage() {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Post | null>(null);

  const postsQuery = usePosts({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status: (statusFilter as PostStatus) || undefined,
    // platform filter is currently not supported by the backend listPosts, 
    // but we'll keep the UI for it
  });

  const deleteMutation = useDeletePost();
  const publishMutation = usePublishPost();

  const posts = postsQuery.data?.data || [];
  const total = postsQuery.data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const statusOptions = [
    { value: '', label: t('history.allStatuses', 'All statuses') },
    { value: 'draft', label: t('history.draft', 'Draft') },
    { value: 'pending_approval', label: t('history.pending', 'Pending Approval') },
    { value: 'approved', label: t('history.approved', 'Approved') },
    { value: 'published', label: t('history.published', 'Published') },
    { value: 'scheduled', label: t('history.scheduled', 'Scheduled') },
    { value: 'failed', label: t('history.failed', 'Failed') },
  ];

  const platformOptions = [
    { value: '', label: t('history.allPlatforms', 'All platforms') },
    ...Object.keys(PLATFORMS).map((pid) => ({
      value: pid,
      label: PLATFORMS[pid as PlatformId].name,
    })),
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handlePublish = (post: Post) => {
    publishMutation.mutate({ id: post.id, platforms: post.platforms as PlatformId[] });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder={t('history.search', 'Search posts...')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              icon={<Search size={16} />}
            />
          </div>
          <div className="flex gap-3">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            />
            <Select
              options={platformOptions}
              value={platformFilter}
              onChange={(e) => {
                setPlatformFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      {/* Posts List */}
      <Card padding="none">
        {postsQuery.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <FileText
              size={48}
              className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
            />
            <p className="text-gray-500 dark:text-gray-400">
              {t('history.noPosts', 'No posts found')}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {posts.map((post) => {
                const badge = statusBadgeMap[post.status] || statusBadgeMap.draft;
                return (
                  <div
                    key={post.id}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => setReviewTarget(post)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                        {post.originalPrompt || post.content.slice(0, 120)}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                        <div className="flex items-center gap-1">
                          {post.platforms.map((pid) => {
                            const Icon = platformIcons[pid as PlatformId];
                            return Icon ? (
                              <Icon
                                key={pid}
                                size={13}
                                className="text-gray-400"
                              />
                            ) : null;
                          })}
                        </div>
                        <span className="text-xs text-gray-400">
                          {format(new Date(post.createdAt), 'MMM d, yyyy HH:mm')}
                        </span>
                        {post.scheduledAt && (
                          <span className="text-xs text-amber-500">
                            Scheduled: {format(new Date(post.scheduledAt), 'MMM d, HH:mm')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <Badge variant={badge.variant}>{badge.label}</Badge>

                      <CopyButton text={post.content} />

                      {post.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Send size={14} />}
                          onClick={() => handlePublish(post)}
                          loading={publishMutation.isPending && publishMutation.variables?.id === post.id}
                        >
                          {t('history.publish', 'Publish')}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReviewTarget(post)}
                      >
                        {t('history.review', 'Review')}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => setDeleteTarget(post)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-500">
                  {t('history.showing', 'Showing')} {(page - 1) * PAGE_SIZE + 1}-
                  {Math.min(page * PAGE_SIZE, total)} {t('history.of', 'of')}{' '}
                  {total}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ChevronLeft size={16} />}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  />
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum =
                      totalPages <= 5
                        ? i + 1
                        : page <= 3
                          ? i + 1
                          : page >= totalPages - 2
                            ? totalPages - 4 + i
                            : page - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          pageNum === page
                            ? 'bg-brand-600 text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ChevronRight size={16} />}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={t('history.confirmDelete', 'Delete Post')}
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {t(
            'history.deleteMessage',
            'Are you sure you want to delete this post? This action cannot be undone.',
          )}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={handleDelete}
          >
            {t('common.delete', 'Delete')}
          </Button>
        </div>
      </Modal>

      <PostDetailsModal
        post={reviewTarget}
        onClose={() => setReviewTarget(null)}
      />
    </div>
  );
}
