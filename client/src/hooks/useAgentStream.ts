import { useState, useEffect } from 'react';

export interface AgentLog {
  id: string;
  module: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  timestamp: string;
}

export function useAgentStream(moduleFilter: 'outreach' | 'autoblog') {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';
    const eventSource = new EventSource(`${apiUrl}/live/stream?module=${moduleFilter}`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AgentLog;
        setLogs((prev) => {
          // Check if log already exists to avoid duplicates
          if (prev.some((log) => log.id === data.id)) return prev;
          
          const newLogs = [...prev, data];
          // Keep maximum 100 logs in memory
          if (newLogs.length > 100) {
            return newLogs.slice(newLogs.length - 100);
          }
          return newLogs;
        });
      } catch (e) {
        console.error('Failed to parse SSE event', e);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      // EventSource automatically tries to reconnect
    };

    return () => {
      eventSource.close();
    };
  }, [moduleFilter]);

  return { logs, isConnected };
}
