import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInbox, useResolveConversation, useReplyToComment } from '@/hooks/useInbox';
import type { InboxComment } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { MessageCircle, CheckCircle2, User, Send, ExternalLink, Bot, AlertTriangle, Cpu, Flame, Snowflake, BrainCircuit, Activity, FileText } from 'lucide-react';
import clsx from 'clsx';
import { MessageTemplateModal } from '@/components/ui/MessageTemplateModal';

export function InboxPage() {
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language === 'fr' ? fr : enUS;

  const { data: inboxComments, isLoading } = useInbox();
  const resolveMutation = useResolveConversation();
  const replyMutation = useReplyToComment();

  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const comments = inboxComments || [];
  const selectedComment = comments.find((c) => c.id === selectedCommentId) || null;

  const handleResolve = async (id: string) => {
    await resolveMutation.mutateAsync(id);
    if (selectedCommentId === id) setSelectedCommentId(null);
  };

  const handleReply = async () => {
    if (!selectedComment || !replyText.trim()) return;
    await replyMutation.mutateAsync({ id: selectedComment.id, content: replyText });
    setReplyText('');
    setSelectedCommentId(null);
  };

  const getMemoryBoxTimeline = (comment: InboxComment) => {
    try {
      if (comment.agentState) {
        return JSON.parse(comment.agentState) as Array<{ role: string; content: any }>;
      }
    } catch {
      // fallback if JSON fails
    }
    return [{ role: 'user', content: comment.content }];
  };

  const renderMessageContent = (content: any) => {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content.map(c => c.type === 'text' ? c.text : JSON.stringify(c)).join('\n');
    }
    return JSON.stringify(content);
  };

  const getLeadColor = (status: string | null, score: number) => {
    if (status?.toLowerCase() === 'hot' || score > 75) return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (status?.toLowerCase() === 'cold' || score < 30) return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
  };

  const getLeadIcon = (status: string | null, score: number) => {
    if (status?.toLowerCase() === 'hot' || score > 75) return <Flame size={12} />;
    if (status?.toLowerCase() === 'cold' || score < 30) return <Snowflake size={12} />;
    return <Activity size={12} />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      <div className="flex flex-col md:flex-row h-full gap-6">
        
        {/* Left Sidebar - List of comments */}
        <div className="w-full md:w-1/3 flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MessageCircle size={20} className="text-brand-500" />
              {t('inbox.title', 'Unified Inbox')}
              <span className="ml-auto bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs py-0.5 px-2 rounded-full">
                {comments.length}
              </span>
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <CheckCircle2 size={40} className="text-green-500 mb-3" />
                <p className="text-gray-900 dark:text-gray-100 font-medium">Inbox Zero!</p>
                <p className="text-sm text-gray-500 mt-1">You're all caught up on your interactions.</p>
              </div>
            ) : (
              comments.map((comment) => (
                <button
                  key={comment.id}
                  onClick={() => setSelectedCommentId(comment.id)}
                  className={clsx(
                    'w-full text-left p-3 rounded-lg transition-colors border',
                    selectedCommentId === comment.id
                      ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800'
                      : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5 truncate">
                      {comment.authorName}
                      <span className="text-[10px] text-gray-400 font-normal capitalize px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                        {comment.platform}
                      </span>
                    </span>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                      {formatDistanceToNow(parseISO(comment.createdAt), { addSuffix: true, locale: currentLocale })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-snug">
                    {comment.content}
                  </p>
                  
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {comment.leadScore > 0 && (
                      <div className={clsx("inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border", getLeadColor(comment.leadStatus, comment.leadScore))}>
                        {getLeadIcon(comment.leadStatus, comment.leadScore)}
                        {comment.leadScore}/100
                      </div>
                    )}
                    {comment.requiresHuman === 1 && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-800">
                        <AlertTriangle size={10} />
                        Requires Human
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Area - Conversation View */}
        <div className="flex-1 h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          {selectedComment ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  {selectedComment.authorAvatarUrl ? (
                    <img src={selectedComment.authorAvatarUrl} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User size={20} className="text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{selectedComment.authorName}</h3>
                    {selectedComment.authorHandle && (
                      <p className="text-xs text-gray-500">@{selectedComment.authorHandle}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleResolve(selectedComment.id)}
                    loading={resolveMutation.isPending}
                    icon={<CheckCircle2 size={16} />}
                  >
                    Resolve
                  </Button>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* Agent Insights Panel */}
                {(selectedComment.leadScore > 0 || selectedComment.leadReason) && (
                  <div className="mb-6 p-4 bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3 text-brand-700 dark:text-brand-400 font-semibold text-sm">
                      <BrainCircuit size={16} />
                      AI SDR Insights
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-shrink-0 flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 min-w-[120px]">
                        <span className={clsx("flex items-center gap-1.5 text-lg font-bold mb-1", getLeadColor(selectedComment.leadStatus, selectedComment.leadScore).split(' ')[0])}>
                          {getLeadIcon(selectedComment.leadStatus, selectedComment.leadScore)}
                          {selectedComment.leadScore} <span className="text-xs text-gray-400 font-normal">/100</span>
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          {selectedComment.leadStatus || 'Unscored'}
                        </span>
                      </div>
                      
                      {selectedComment.leadReason && (
                        <div className="flex-1 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                          <p className="italic leading-relaxed">"{selectedComment.leadReason}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Original Post Context */}
                {selectedComment.postContent && (
                  <div className="flex justify-center">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400 max-w-xl text-center border border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">Original Post</p>
                      <p className="line-clamp-3">{selectedComment.postContent}</p>
                    </div>
                  </div>
                )}

                {/* Timeline / Memory Box */}
                <div className="space-y-4">
                  {getMemoryBoxTimeline(selectedComment).map((msg, idx) => (
                    <div key={idx} className={clsx("flex gap-3", msg.role === 'assistant' ? "flex-row-reverse" : "flex-row")}>
                      <div className="flex-shrink-0 mt-1">
                        {msg.role === 'assistant' ? (
                          <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center border border-brand-200 dark:border-brand-800">
                            <Bot size={16} />
                          </div>
                        ) : selectedComment.authorAvatarUrl ? (
                          <img src={selectedComment.authorAvatarUrl} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <User size={16} className="text-gray-500" />
                          </div>
                        )}
                      </div>
                      
                      <div className={clsx(
                        "p-4 rounded-2xl inline-block max-w-[80%]",
                        msg.role === 'assistant' 
                          ? "bg-brand-600 text-white rounded-tr-sm" 
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm"
                      )}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-1.5 mb-1 text-brand-200 text-[10px] uppercase font-bold tracking-wider">
                            <Cpu size={12} /> AI Agent
                          </div>
                        )}
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{renderMessageContent(msg.content)}</p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex flex-col gap-3">
                  <textarea
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 transition-shadow resize-none"
                    rows={3}
                    placeholder={`Reply to ${selectedComment.authorName}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Bot size={14} /> AI SDR paused, manual takeover active.
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setIsTemplateModalOpen(true)}
                        icon={<FileText size={16} />}
                      >
                        Templates
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleReply}
                        loading={replyMutation.isPending}
                        disabled={!replyText.trim()}
                        icon={<Send size={16} />}
                      >
                        Send Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
              <MessageCircle size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Select a conversation</p>
              <p className="text-sm mt-1 max-w-sm">
                Choose a conversation from the left to view details and reply.
              </p>
            </div>
          )}
        </div>

      </div>

      {selectedComment && (
        <MessageTemplateModal
          open={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          recipientName={selectedComment.authorName}
          onApply={(generatedText) => {
            setReplyText(generatedText);
          }}
        />
      )}
    </div>
  );
}
