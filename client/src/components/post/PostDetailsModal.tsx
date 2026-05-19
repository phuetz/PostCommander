import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Send, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import type { Post } from '@postcommander/shared';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { usePostComments, useAddPostComment, useUpdatePostStatus } from '@/hooks/usePosts';

interface PostDetailsModalProps {
  post: Post | null;
  onClose: () => void;
}

export function PostDetailsModal({ post, onClose }: PostDetailsModalProps) {
  const { t } = useTranslation();
  const [commentText, setCommentText] = useState('');

  const commentsQuery = usePostComments(post?.id || '');
  const addCommentMutation = useAddPostComment(post?.id || '');
  const updateStatusMutation = useUpdatePostStatus();

  if (!post) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addCommentMutation.mutateAsync(commentText);
    setCommentText('');
  };

  const handleStatusUpdate = async (status: string) => {
    await updateStatusMutation.mutateAsync({ id: post.id, status });
  };

  return (
    <Modal open={!!post} onClose={onClose} title={t('postDetails.title', 'Post Details & Review')}>
      <div className="space-y-6">
        {/* Post Content */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Actions (Collaboration) */}
        <div className="flex gap-3 justify-end border-b border-gray-100 dark:border-gray-800 pb-4">
          {post.status === 'draft' && (
            <Button
              onClick={() => handleStatusUpdate('needs_approval')}
              loading={updateStatusMutation.isPending}
              icon={<Send size={16} />}
            >
              {t('postDetails.requestApproval', 'Request Approval')}
            </Button>
          )}
          {post.status === 'needs_approval' && (
            <>
              <Button
                variant="danger"
                onClick={() => handleStatusUpdate('draft')}
                loading={updateStatusMutation.isPending}
                icon={<XCircle size={16} />}
              >
                {t('postDetails.reject', 'Reject to Draft')}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleStatusUpdate('approved')}
                loading={updateStatusMutation.isPending}
                icon={<CheckCircle size={16} />}
              >
                {t('postDetails.approve', 'Approve')}
              </Button>
            </>
          )}
        </div>

        {/* Comments Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageSquare size={18} />
            {t('postDetails.internalComments', 'Internal Comments')}
          </h3>

          <div className="max-h-64 overflow-y-auto space-y-3">
            {commentsQuery.isLoading ? (
              <div className="py-4 text-center">
                <Spinner size="sm" />
              </div>
            ) : commentsQuery.data?.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('postDetails.noComments', 'No comments yet.')}
              </p>
            ) : (
              commentsQuery.data?.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 text-xs font-bold">
                      {comment.user?.name?.[0]?.toUpperCase() ||
                        comment.user?.email?.[0]?.toUpperCase() ||
                        '?'}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {comment.user?.name || comment.user?.email}
                    </span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(comment.createdAt), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 ml-8">{comment.content}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t('postDetails.addComment', 'Add a comment...')}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!commentText.trim() || addCommentMutation.isPending}
              loading={addCommentMutation.isPending}
            >
              {t('common.send', 'Send')}
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
