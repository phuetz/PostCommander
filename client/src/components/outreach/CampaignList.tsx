import { useOutreachCampaigns, useOutreachProspects, useUpdateCampaign, useDeleteCampaign } from '../../hooks/useOutreach';
import { Play, Pause, AlertOctagon, Users, Target, Activity, Trash2, StopCircle, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function CampaignList() {
  const { data: campaigns, isLoading } = useOutreachCampaigns();
  const updateMutation = useUpdateCampaign();
  const deleteMutation = useDeleteCampaign();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const toggleStatus = (campaign: any, e: React.MouseEvent) => {
    e.stopPropagation();
    updateMutation.mutate({
      id: campaign.id,
      updates: { status: campaign.status === 'active' ? 'paused' : 'active' }
    });
  };

  const handleDelete = (campaignId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm('Voulez-vous vraiment supprimer cette campagne ?')) {
      deleteMutation.mutate(campaignId);
      if (selectedCampaignId === campaignId) setSelectedCampaignId(null);
    }
  };

  if (isLoading) return <div className="animate-pulse space-y-4">Loading campaigns...</div>;
  if (!campaigns || campaigns.length === 0) return <div className="text-gray-500 py-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl">No active campaigns. Create one above!</div>;

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence>
          {campaigns.map((campaign) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              key={campaign.id} 
              className={`bg-white dark:bg-gray-900 border rounded-xl overflow-hidden transition-all cursor-pointer hover:shadow-lg ${selectedCampaignId === campaign.id ? 'ring-2 ring-indigo-500 border-transparent shadow-md' : 'border-gray-200 dark:border-gray-800'}`}
              onClick={() => setSelectedCampaignId(campaign.id)}
            >
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{campaign.name}</h3>
                {campaign.status === 'paused' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-md">
                    <AlertOctagon size={12} />
                    Paused (Safety)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-md">
                    <Play size={12} />
                    Active
                  </span>
                )}
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-gray-400" />
                  <span className="truncate">{campaign.targetActivity || campaign.targetKeywords}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-gray-400" />
                  <span>Goal: {campaign.campaignGoal}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Prospects</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-lg">{campaign.stats?.totalProspects || 0}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => toggleStatus(campaign, e)}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 rounded-lg transition-colors"
                    title={campaign.status === 'active' ? 'Mettre en pause' : 'Reprendre'}
                  >
                    {campaign.status === 'active' ? <StopCircle size={18} /> : <PlayCircle size={18} />}
                  </button>
                  <button
                    onClick={(e) => handleDelete(campaign.id, e)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Contacted</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-lg">{campaign.stats?.contacted || 0}</span>
                </div>
              </div>
            </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {selectedCampaignId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <ProspectList campaignId={selectedCampaignId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProspectList({ campaignId }: { campaignId: string }) {
  const { data: prospects, isLoading } = useOutreachProspects(campaignId);

  if (isLoading) return <div className="animate-pulse py-4">Loading prospects...</div>;
  if (!prospects || prospects.length === 0) return null;

  return (
    <div className="mt-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Users size={18} className="text-indigo-500" />
          Campaign Prospects Pipeline
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400">
            <tr>
              <th className="px-6 py-3 font-medium">Prospect</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Step</th>
              <th className="px-6 py-3 font-medium">Reply</th>
              <th className="px-6 py-3 font-medium">Last Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {prospects.map((prospect) => (
              <tr key={prospect.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 dark:text-white">{prospect.profileName}</div>
                  <div className="text-gray-500 text-xs truncate max-w-[200px]">{prospect.profileBio}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    prospect.status === 'discovered' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    prospect.status === 'contacted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {prospect.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                  Step {prospect.currentStepNumber}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    prospect.replyStatus === 'replied_positive' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    prospect.replyStatus === 'replied_negative' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {prospect.replyStatus.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {prospect.lastContactedAt ? new Date(prospect.lastContactedAt).toLocaleDateString() : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
