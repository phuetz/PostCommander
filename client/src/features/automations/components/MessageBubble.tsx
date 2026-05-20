import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, Bot, Search, Globe, Zap, Plus, Pencil, Trash2, Link2, Unlink } from 'lucide-react';
import type { LiveToolCall } from '../hooks/useChatStream';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: LiveToolCall[];
}

function toolBadgeMeta(name: string) {
  switch (name) {
    case 'searchWeb':
      return { Icon: Search, color: 'text-teal-500' };
    case 'scrapeUrlPreview':
      return { Icon: Globe, color: 'text-blue-500' };
    case 'getWorkflowState':
      return { Icon: Sparkles, color: 'text-purple-500' };
    case 'addNode':
      return { Icon: Plus, color: 'text-emerald-500' };
    case 'updateNode':
      return { Icon: Pencil, color: 'text-brand-500' };
    case 'deleteNode':
      return { Icon: Trash2, color: 'text-red-500' };
    case 'connectNodes':
      return { Icon: Link2, color: 'text-amber-500' };
    case 'disconnectNodes':
      return { Icon: Unlink, color: 'text-amber-500' };
    default:
      return { Icon: Bot, color: 'text-brand-500' };
  }
}

function toolLabel(name: string, args: any): string {
  switch (name) {
    case 'searchWeb':
      return `Recherche : "${args?.query ?? ''}"`;
    case 'scrapeUrlPreview':
      return `Analyse : ${args?.url ?? ''}`;
    case 'addNode':
      return `+ ${args?.label ?? args?.kind ?? 'nœud'}`;
    case 'updateNode':
      return `~ ${args?.id ?? ''}`;
    case 'deleteNode':
      return `− ${args?.id ?? ''}`;
    case 'connectNodes':
      return `${args?.source ?? ''} → ${args?.target ?? ''}`;
    case 'disconnectNodes':
      return `${args?.source ?? ''} ↛ ${args?.target ?? ''}`;
    case 'getWorkflowState':
      return 'Lecture du canevas';
    default:
      return name;
  }
}

export function MessageBubble({ role, content, toolCalls }: MessageBubbleProps) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed transition-all duration-200 ${
          isUser
            ? 'bg-brand-600 text-white rounded-tr-none font-medium'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200/50 dark:border-gray-700/50'
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase font-bold tracking-wider text-brand-500">
            <Sparkles size={10} className="animate-pulse" />
            Assistant PC
          </div>
        )}

        {isUser ? (
          <div className="whitespace-pre-wrap">{content}</div>
        ) : (
          <div className="text-xs leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="my-1">{children}</p>,
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ inline, children }: any) =>
                  inline ? (
                    <code className="px-1 py-0.5 rounded font-mono text-[10px] bg-gray-200 dark:bg-gray-850">
                      {children}
                    </code>
                  ) : (
                    <code className="block font-mono text-[10px]">{children}</code>
                  ),
                pre: ({ children }) => (
                  <pre className="bg-gray-200 dark:bg-gray-850 rounded-lg p-2 my-1.5 overflow-x-auto text-[10px]">
                    {children}
                  </pre>
                ),
                ul: ({ children }) => <ul className="list-disc list-inside my-1 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside my-1 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="ml-1">{children}</li>,
                a: ({ children, href }) => (
                  <a href={href} target="_blank" rel="noreferrer" className="text-brand-500 underline hover:text-brand-600">
                    {children}
                  </a>
                ),
                h1: ({ children }) => <h1 className="text-sm font-bold my-1.5">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xs font-bold my-1.5">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xs font-bold my-1">{children}</h3>,
              }}
            >
              {content || (toolCalls?.length ? '_…_' : '')}
            </ReactMarkdown>
          </div>
        )}

        {toolCalls && toolCalls.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-gray-200 dark:border-gray-700/60 space-y-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>Traces de l'agent</span>
              <span className="px-1.5 py-0.2 bg-brand-500/10 text-brand-500 rounded-full text-[9px] lowercase font-normal">
                {toolCalls.length} {toolCalls.length > 1 ? 'appels' : 'appel'}
              </span>
            </div>
            <div className="space-y-1.5 pl-1.5 border-l border-brand-500/30 ml-1">
              {toolCalls.map((tc, idx) => {
                const { Icon, color } = toolBadgeMeta(tc.name);
                const pending = !tc.result;
                return (
                  <div key={tc.toolCallId || idx} className="text-[10px] text-gray-500 dark:text-gray-400 relative pl-3.5 py-0.5">
                    <span
                      className={`absolute -left-[4.5px] top-1.5 w-2 h-2 rounded-full border border-white dark:border-gray-900 ${
                        pending ? 'bg-amber-400 animate-pulse' : 'bg-brand-500'
                      }`}
                    />
                    <div className="flex items-center gap-1.5">
                      <Icon size={10} className={color} />
                      <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[260px]" title={toolLabel(tc.name, tc.args)}>
                        {toolLabel(tc.name, tc.args)}
                      </span>
                      {pending && (
                        <span className="text-[8px] text-amber-500 font-bold uppercase tracking-wider">en cours</span>
                      )}
                    </div>
                    {tc.result?.message && tc.result?.status === 'error' && (
                      <div className="ml-3.5 text-red-500 text-[9px] italic mt-0.5">
                        {tc.result.message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isUser && !content && (!toolCalls || toolCalls.length === 0) && (
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-0" />
            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-150" />
            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-300" />
          </div>
        )}

        {/* Decorative bot icon to balance the layout */}
        {isUser && <Zap size={0} className="hidden" />}
      </div>
    </div>
  );
}
