import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/api';

export interface Workspace {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string) => void;
  isLoading: boolean;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkspaces = async () => {
    try {
      // Temporary workaround until the API endpoint is created
      const { data } = await api.get<{ success: boolean; data: Workspace[] }>('/workspaces');
      if (data.success) {
        setWorkspaces(data.data);
        if (data.data.length > 0) {
          const savedId = localStorage.getItem('postcommander_workspace_id');
          if (savedId && data.data.some((w: Workspace) => w.id === savedId)) {
            setActiveWorkspaceId(savedId);
          } else {
            setActiveWorkspaceId(data.data[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch workspaces', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Update Axios interceptor when activeWorkspaceId changes
  useEffect(() => {
    if (activeWorkspaceId) {
      localStorage.setItem('postcommander_workspace_id', activeWorkspaceId);
      api.defaults.headers.common['x-workspace-id'] = activeWorkspaceId;
    } else {
      localStorage.removeItem('postcommander_workspace_id');
      delete api.defaults.headers.common['x-workspace-id'];
    }
  }, [activeWorkspaceId]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspaceId,
        setActiveWorkspaceId,
        isLoading,
        refreshWorkspaces: fetchWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
