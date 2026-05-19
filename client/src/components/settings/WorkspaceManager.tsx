import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users, UserPlus, Trash2, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface WorkspaceMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export function WorkspaceManager() {
  const { t } = useTranslation();
  const { workspaces, activeWorkspaceId } = useWorkspace();
  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  const { data: members, isLoading } = useQuery<WorkspaceMember[]>({
    queryKey: ['workspace-members', currentWorkspace?.id],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${currentWorkspace?.id}/members`);
      if (!res.ok) throw new Error('Failed to fetch members');
      const data = await res.json();
      return data.data;
    },
    enabled: !!currentWorkspace?.id,
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const res = await fetch(`/api/workspaces/${currentWorkspace?.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to invite member');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Member invited successfully');
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['workspace-members', currentWorkspace?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/workspaces/${currentWorkspace?.id}/members/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to remove member');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Member removed successfully');
      queryClient.invalidateQueries({ queryKey: ['workspace-members', currentWorkspace?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const currentUserMembership = members?.find((m) => m.userId === user?.id);
  const isAdmin = currentUserMembership?.role === 'owner' || currentUserMembership?.role === 'admin';

  if (!currentWorkspace) return null;

  return (
    <Card className="mt-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600">
          <Users size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {t('settings.teamManagement', 'Team Management')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('settings.teamManagementDesc', 'Manage workspace members and roles.')}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 flex justify-center">
          <Spinner size="sm" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Invite Form */}
          {isAdmin && (
            <form onSubmit={handleInvite} className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="w-48">
                <Select
                  label="Role"
                  options={[
                    { value: 'member', label: 'Member' },
                    { value: 'admin', label: 'Admin' },
                  ]}
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                loading={inviteMutation.isPending}
                icon={<UserPlus size={18} />}
              >
                Invite
              </Button>
            </form>
          )}

          {/* Members List */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-200 dark:divide-gray-800">
            {members?.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                    {member.role === 'owner' ? <Shield size={18} /> : <User size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {member.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 capitalize">
                    {member.role}
                  </span>

                  {isAdmin && member.userId !== user?.id && member.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => {
                        if (confirm('Are you sure you want to remove this member?')) {
                          removeMutation.mutate(member.userId);
                        }
                      }}
                      icon={<Trash2 size={16} />}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
