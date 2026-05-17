import { useState, useRef, useCallback } from 'react';
import { streamPost, generatePost } from '@/services/api';
import type { GenerateRequest, GenerateResponse } from '@postcommander/shared';

interface GenerateState {
  isGenerating: boolean;
  streamedContent: string;
  agentStatus: string | null;
  result: GenerateResponse | null;
  error: string | null;
}

export function useGenerate() {
  const [state, setState] = useState<GenerateState>({
    isGenerating: false,
    streamedContent: '',
    agentStatus: null,
    result: null,
    error: null,
  });

  const abortRef = useRef<(() => void) | null>(null);

  const generate = useCallback(async (request: GenerateRequest, useStream = true) => {
    // Cancel previous generation
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }

    setState({
      isGenerating: true,
      streamedContent: '',
      agentStatus: null,
      result: null,
      error: null,
    });

    if (useStream) {
      const cancel = streamPost(
        request,
        (token) => {
          setState((prev) => ({
            ...prev,
            streamedContent: prev.streamedContent + token,
          }));
        },
        (result) => {
          setState({
            isGenerating: false,
            streamedContent: result.content,
            agentStatus: null,
            result,
            error: null,
          });
          abortRef.current = null;
        },
        (error) => {
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            agentStatus: null,
            error,
          }));
          abortRef.current = null;
        },
        (status) => {
          setState((prev) => ({
            ...prev,
            agentStatus: status,
          }));
        }
      );
      abortRef.current = cancel;
    } else {
      try {
        const result = await generatePost(request);
        setState({
          isGenerating: false,
          streamedContent: result.content,
          agentStatus: null,
          result,
          error: null,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Generation failed';
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: message,
        }));
      }
    }
  }, []);

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
    setState((prev) => ({ ...prev, isGenerating: false }));
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
    setState({
      isGenerating: false,
      streamedContent: '',
      agentStatus: null,
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    generate,
    cancel,
    reset,
  };
}
