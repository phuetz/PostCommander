import { useEffect, useRef } from 'react';
import { Terminal, Activity } from 'lucide-react';
import { AgentLog } from '../../hooks/useAgentStream';

interface LiveTerminalProps {
  logs: AgentLog[];
  isConnected: boolean;
  title?: string;
}

export function LiveTerminal({ logs, isConnected, title = 'Agent Terminal' }: LiveTerminalProps) {
  const endOfLogsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLevelColor = (level: AgentLog['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-500';
      case 'warn':
        return 'text-yellow-400';
      case 'success':
        return 'text-emerald-400';
      default:
        return 'text-green-500'; // Default hacker green
    }
  };

  return (
    <div className="flex flex-col bg-black rounded-lg border border-neutral-800 shadow-2xl overflow-hidden h-full min-h-[400px]">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-neutral-400" />
          <span className="text-sm font-mono text-neutral-300">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-500">
            {isConnected ? 'CONN. ACTIVE' : 'RECONNECTING...'}
          </span>
          <Activity 
            className={`w-3 h-3 ${isConnected ? 'text-green-500 animate-pulse' : 'text-neutral-600'}`} 
          />
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 p-4 font-mono text-sm overflow-y-auto bg-black scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
        {logs.length === 0 ? (
          <div className="text-neutral-600 italic">En attente d'activité de l'agent...</div>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 leading-relaxed break-words">
                <span className="text-neutral-600 shrink-0 select-none">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span className={`${getLevelColor(log.level)}`}>
                  <span className="text-neutral-500 select-none mr-2">$</span>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={endOfLogsRef} />
          </div>
        )}
      </div>
    </div>
  );
}
