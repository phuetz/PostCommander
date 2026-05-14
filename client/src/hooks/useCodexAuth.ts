import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/services/api';
import type { ApiResponse } from '@postcommander/shared';
import toast from 'react-hot-toast';

export interface CodexAuthStatus {
  connected: boolean;
  email?: string;
  planType?: string;
  accountId?: string;
}

interface StartResponse {
  authUrl: string;
  port: number;
}

const STATUS_POLL_INTERVAL_MS = 2000;
const STATUS_POLL_TIMEOUT_MS = 5 * 60 * 1000;

async function fetchStatus(): Promise<CodexAuthStatus> {
  const { data } = await api.get<ApiResponse<CodexAuthStatus>>('/auth/chatgpt-pro/status');
  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to load ChatGPT Pro status');
  }
  return data.data;
}

export function useCodexAuth() {
  const [status, setStatus] = useState<CodexAuthStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const pollTimer = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const s = await fetchStatus();
      setStatus(s);
    } catch (err) {
      // 401 means not logged in to app — don't surface as a ChatGPT error.
      if (err instanceof Error && !/401/.test(err.message)) {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => {
      if (pollTimer.current) window.clearTimeout(pollTimer.current);
    };
  }, [refresh]);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const { data } = await api.post<ApiResponse<StartResponse>>('/auth/chatgpt-pro/start');
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to start ChatGPT Pro login');
      }
      window.open(data.data.authUrl, '_blank', 'noopener,noreferrer');
      toast.success('Onglet OAuth ouvert. Connecte-toi à ChatGPT.');

      // Poll until success or timeout
      const startedAt = Date.now();
      const poll = async () => {
        const s = await fetchStatus().catch(() => null);
        if (s?.connected) {
          setStatus(s);
          setConnecting(false);
          toast.success(`Connecté à ChatGPT (${s.email ?? 'compte'}) ✓`);
          return;
        }
        if (Date.now() - startedAt > STATUS_POLL_TIMEOUT_MS) {
          setConnecting(false);
          toast.error('Timeout : connexion non détectée après 5 minutes.');
          return;
        }
        pollTimer.current = window.setTimeout(poll, STATUS_POLL_INTERVAL_MS);
      };
      pollTimer.current = window.setTimeout(poll, STATUS_POLL_INTERVAL_MS);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion';
      toast.error(message);
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const { data } = await api.post<ApiResponse>('/auth/chatgpt-pro/logout');
      if (!data.success) {
        throw new Error(data.error || 'Failed to disconnect');
      }
      setStatus({ connected: false });
      toast.success('ChatGPT Pro déconnecté.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de déconnexion');
    }
  }, []);

  return { status, loading, connecting, connect, disconnect, refresh };
}
