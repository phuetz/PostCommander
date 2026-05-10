import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageCircle,
  Bot,
  Send,
  User,
  Sparkles,
  Target,
  Flame,
  Snowflake,
  Handshake,
  AlertTriangle,
} from 'lucide-react';
import { getSocialComments, runAgentStep, scoreComment } from '@/services/api';
import type { SocialComment, LLMProviderId } from '@postcommander/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { LLMSelector } from '@/components/post/LLMSelector';
import toast from 'react-hot-toast';

export function CommunityTab() {
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<LLMProviderId>('openai');
  const [model, setModel] = useState('gpt-4o');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [scoringId, setScoringId] = useState<string | null>(null);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['socialComments'],
    queryFn: getSocialComments,
  });

  const agentMutation = useMutation({
    mutationFn: (params: {
      id: string;
      providerId: string;
      modelId: string;
      userMessage?: string;
    }) => runAgentStep(params.id, params),
    onMutate: (variables) => {
      setGeneratingId(variables.id);
    },
    onSuccess: () => {
      toast.success('Agent step completed!');
      queryClient.invalidateQueries({ queryKey: ['socialComments'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Agent error');
    },
    onSettled: () => {
      setGeneratingId(null);
    },
  });

  const scoreMutation = useMutation({
    mutationFn: (params: { id: string; providerId: string; modelId: string }) =>
      scoreComment(params.id, params),
    onMutate: (variables) => {
      setScoringId(variables.id);
    },
    onSuccess: () => {
      toast.success('Lead scored successfully!');
      queryClient.invalidateQueries({ queryKey: ['socialComments'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to score lead');
    },
    onSettled: () => {
      setScoringId(null);
    },
  });

  const handleAgentStep = (commentId: string, userMessage?: string) => {
    agentMutation.mutate({ id: commentId, providerId: provider, modelId: model, userMessage });
  };

  const handleScoreLead = (commentId: string) => {
    scoreMutation.mutate({ id: commentId, providerId: provider, modelId: model });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageCircle size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No comments yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            When your published posts receive comments on social platforms, they will appear here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Auto-Reply Configuration
          </h3>
          <div className="mt-3">
            <LLMSelector
              provider={provider}
              model={model}
              onProviderChange={setProvider}
              onModelChange={setModel}
            />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {comments.map((comment: SocialComment) => (
          <Card key={comment.id} className="overflow-hidden">
            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0 text-brand-600 dark:text-brand-400">
                  {comment.authorAvatarUrl ? (
                    <img
                      src={comment.authorAvatarUrl}
                      alt={comment.authorName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {comment.authorName}
                      </span>
                      {comment.authorHandle && (
                        <span className="ml-2 text-sm text-gray-500">@{comment.authorHandle}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(comment.publishedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {comment.content}
                  </p>

                  <div className="mt-4 flex justify-end">
                    {comment.agentState ? (
                      <div className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                          <Bot size={16} className="text-brand-500" />
                          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                            AI Agent Conversation
                          </span>
                          {comment.requiresHuman && (
                            <span className="ml-auto text-xs flex items-center gap-1 text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
                              <AlertTriangle size={12} /> Needs Human
                            </span>
                          )}
                        </div>
                        <div className="space-y-3">
                          {(() => {
                            try {
                              const history = JSON.parse(comment.agentState);
                              return history.slice(1).map((msg: any, i: number) => (
                                <div
                                  key={i}
                                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`max-w-[85%] rounded-lg p-2 text-sm ${msg.role === 'user' ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-900 dark:text-brand-100' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                                  >
                                    {msg.content ||
                                      (msg.toolCalls
                                        ? `[Tool Call: ${msg.toolCalls[0].toolName}]`
                                        : '[Agent action]')}
                                  </div>
                                </div>
                              ));
                            } catch (e) {
                              return <p>Error parsing history</p>;
                            }
                          })()}
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button
                            onClick={() => handleAgentStep(comment.id)}
                            loading={generatingId === comment.id}
                            disabled={generatingId !== null || comment.requiresHuman}
                            icon={<Sparkles size={16} />}
                            size="sm"
                            className="w-full"
                          >
                            Continue Agent Step
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {comment.leadStatus === 'unscored' && (
                          <Button
                            onClick={() => handleScoreLead(comment.id)}
                            loading={scoringId === comment.id}
                            disabled={scoringId !== null || generatingId !== null}
                            icon={<Target size={16} />}
                            size="sm"
                            variant="secondary"
                          >
                            Analyze Lead
                          </Button>
                        )}
                        <Button
                          onClick={() => handleAgentStep(comment.id)}
                          loading={generatingId === comment.id}
                          disabled={generatingId !== null || scoringId !== null}
                          icon={<Sparkles size={16} />}
                          size="sm"
                        >
                          Start Agent
                        </Button>
                      </div>
                    )}
                  </div>

                  {comment.leadStatus !== 'unscored' && (
                    <div className="mt-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        {comment.leadStatus === 'hot' && (
                          <Flame size={16} className="text-red-500" />
                        )}
                        {comment.leadStatus === 'potential' && (
                          <Handshake size={16} className="text-brand-500" />
                        )}
                        {comment.leadStatus === 'unqualified' && (
                          <Snowflake size={16} className="text-blue-400" />
                        )}

                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                          {comment.leadStatus} Lead (Score: {comment.leadScore})
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {comment.leadReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
