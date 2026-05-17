import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePosts, useApprovePost, useRejectPost } from '@/hooks/usePosts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';

export function ApprovalsPage() {
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language === 'fr' ? fr : enUS;

  const { data: postsData, isLoading, isError } = usePosts({ page: 1, pageSize: 50, status: 'needs_approval' });
  const approveMutation = useApprovePost();
  const rejectMutation = useRejectPost();

  const [rejectingPostId, setRejectingPostId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const posts = postsData?.data || [];

  const handleApprove = async (id: string) => {
    await approveMutation.mutateAsync(id);
  };

  const handleRejectSubmit = async () => {
    if (!rejectingPostId) return;
    await rejectMutation.mutateAsync({ id: rejectingPostId, feedback });
    setRejectingPostId(null);
    setFeedback('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-500">{t('common.errorLoading', 'An error occurred while loading.')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('approvals.title', 'Pending Approvals')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('approvals.subtitle', 'Review and approve content before it goes live.')}
          </p>
        </div>
      </div>

      {posts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {t('approvals.empty', "You're all caught up!")}
          </h3>
          <p className="text-gray-500 mt-1">
            {t('approvals.emptyDesc', 'There are no posts waiting for your approval.')}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 mb-3">
                      <Clock size={14} />
                      {t('approvals.statusPending', 'Awaiting Approval')}
                    </span>
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {post.platforms.map((p) => (
                      <span key={p} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-medium capitalize">
                        {p}
                      </span>
                    ))}
                    {post.scheduledAt && (
                      <span className="px-2 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-600 rounded text-xs font-medium">
                        {format(parseISO(post.scheduledAt), 'PPP p', { locale: currentLocale })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 md:flex-col min-w-[120px]">
                  <Button
                    className="w-full"
                    onClick={() => handleApprove(post.id)}
                    loading={approveMutation.isPending}
                    icon={<CheckCircle2 size={18} />}
                  >
                    {t('common.approve', 'Approve')}
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
                    onClick={() => setRejectingPostId(post.id)}
                    icon={<XCircle size={18} />}
                  >
                    {t('common.reject', 'Reject')}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!rejectingPostId}
        onClose={() => {
          setRejectingPostId(null);
          setFeedback('');
        }}
        title={t('approvals.rejectTitle', 'Reject Post')}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('approvals.rejectDesc', 'Provide feedback so the creator knows what to change.')}
          </p>
          <textarea
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-500 transition-shadow resize-none"
            rows={4}
            placeholder={t('approvals.feedbackPlaceholder', 'Explain why this post is rejected...')}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setRejectingPostId(null);
                setFeedback('');
              }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRejectSubmit}
              loading={rejectMutation.isPending}
              disabled={!feedback.trim()}
            >
              {t('common.reject', 'Reject')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
