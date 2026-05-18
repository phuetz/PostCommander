import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Key,
  Server,
  Palette,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Music,
  Pin,
  Save,
  Link2,
  Unlink,
  Eye,
  EyeOff,
  Download,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { usePlatforms, useConnectPlatform, useDisconnectPlatform } from '@/hooks/usePlatforms';
import { useAuth } from '@/hooks/useAuth';
import { deleteAccount, exportAccountData } from '@/services/api';
import {
  LLM_PROVIDERS,
  TONES,
  PLATFORMS,
  type PlatformId,
  type Settings,
} from '@postcommander/shared';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { ChatGPTProSection } from '@/components/settings/ChatGPTProSection';
import { WorkspaceManager } from '@/components/settings/WorkspaceManager';

const platformIcons: Record<PlatformId, React.ElementType> = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Music,
  pinterest: Pin,
};

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const settingsQuery = useSettings();
  const platformsQuery = usePlatforms();
  const updateSettingsMutation = useUpdateSettings();
  const connectMutation = useConnectPlatform();
  const disconnectMutation = useDisconnectPlatform();

  const [form, setForm] = useState<Settings>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    if (settingsQuery.data) {
      setForm(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const updateField = (key: keyof Settings, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(form);
  };

  const handleLanguageChange = (lang: string) => {
    updateField('defaultLanguage', lang);
    i18n.changeLanguage(lang);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const { blob, filename } = await exportAccountData();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(t('settings.exportSuccess', 'Your account export is ready.'));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('settings.exportError', 'Failed to export account data.'),
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const { message } = await deleteAccount(deletePassword, 'DELETE');
      toast.success(message);
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('settings.deleteAccountError', 'Failed to delete account.'),
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const connections = platformsQuery.data || [];

  // Build provider and model options
  const providerOptions = LLM_PROVIDERS.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const currentProvider = LLM_PROVIDERS.find((p) => p.id === form.defaultProvider);
  const modelOptions = (currentProvider?.models || LLM_PROVIDERS[0].models).map((m) => ({
    value: m.id,
    label: m.name,
    description: m.description,
  }));

  const toneOptions = TONES.map((tone) => ({
    value: tone.id,
    label: `${tone.emoji} ${t(tone.labelKey, tone.id)}`,
  }));

  const languageOptions = [
    { value: 'fr', label: 'Francais' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Espanol' },
    { value: 'de', label: 'Deutsch' },
    { value: 'pt', label: 'Portugues' },
    { value: 'ar', label: 'Arabic' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' },
  ];

  if (settingsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const apiKeyFields: { key: keyof Settings; label: string; provider: string }[] = [
    { key: 'openaiApiKey', label: 'OpenAI API Key', provider: 'openai' },
    { key: 'anthropicApiKey', label: 'Anthropic API Key', provider: 'anthropic' },
    { key: 'googleApiKey', label: 'Google API Key', provider: 'google' },
    { key: 'mistralApiKey', label: 'Mistral API Key', provider: 'mistral' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* ChatGPT Pro OAuth — no API key needed */}
      <ChatGPTProSection />

      {/* API Keys */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600">
            <Key size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {t('settings.apiKeys', 'API Keys')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('settings.apiKeysDesc', 'Configure your LLM provider API keys')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {apiKeyFields.map(({ key, label }) => (
            <div key={key} className="relative">
              <Input
                label={label}
                type={showKeys[key] ? 'text' : 'password'}
                value={(form[key] as string) || ''}
                onChange={(e) => updateField(key, e.target.value)}
                placeholder="sk-..."
              />
              <button
                type="button"
                onClick={() => toggleKeyVisibility(key)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showKeys[key] ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Ollama Config */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600">
            <Server size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {t('settings.ollama', 'Ollama (Local)')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('settings.ollamaDesc', 'Configure your local Ollama instance')}
            </p>
          </div>
        </div>

        <Input
          label={t('settings.ollamaUrl', 'Ollama Base URL')}
          value={form.ollamaBaseUrl || ''}
          onChange={(e) => updateField('ollamaBaseUrl', e.target.value)}
          placeholder="http://localhost:11434"
        />
      </Card>

      {/* Defaults */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600">
            <Palette size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {t('settings.defaults', 'Default Preferences')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('settings.defaultsDesc', 'Set defaults for new post generation')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('settings.defaultProvider', 'Default Provider')}
              options={providerOptions}
              value={form.defaultProvider || 'openai'}
              onChange={(e) => updateField('defaultProvider', e.target.value)}
            />
            <Select
              label={t('settings.defaultModel', 'Default Model')}
              options={modelOptions}
              value={form.defaultModel || modelOptions[0]?.value || ''}
              onChange={(e) => updateField('defaultModel', e.target.value)}
            />
          </div>

          <Select
            label={t('settings.defaultTone', 'Default Tone')}
            options={toneOptions}
            value={form.defaultTone || 'professional'}
            onChange={(e) => updateField('defaultTone', e.target.value)}
          />
        </div>
      </Card>

      {/* Language */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600">
            <Globe size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {t('settings.language', 'Language')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('settings.languageDesc', 'Choose your preferred language')}
            </p>
          </div>
        </div>

        <Select
          options={languageOptions}
          value={form.defaultLanguage || i18n.language || 'fr'}
          onChange={(e) => handleLanguageChange(e.target.value)}
        />
      </Card>

      {/* Platform Connections */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600">
            <Link2 size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {t('settings.platforms', 'Platform Connections')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t(
                'settings.platformsDesc',
                'Connect your social media accounts for direct publishing',
              )}
            </p>
          </div>
        </div>

        {platformsQuery.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : (
          <div className="space-y-3">
            {(Object.keys(PLATFORMS) as PlatformId[]).map((pid) => {
              const platform = PLATFORMS[pid];
              const Icon = platformIcons[pid];
              const connection = connections.find((c) => c.platform === pid);
              const isConnected = connection?.connected || false;

              return (
                <div
                  key={pid}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: platform.color }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {platform.name}
                      </p>
                      {isConnected && connection?.accountName && (
                        <p className="text-xs text-gray-500">{connection.accountName}</p>
                      )}
                    </div>
                  </div>

                  {isConnected ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Unlink size={14} />}
                      onClick={() => disconnectMutation.mutate(pid)}
                      loading={disconnectMutation.isPending}
                      className="text-red-500 hover:text-red-600"
                    >
                      {t('settings.disconnect', 'Disconnect')}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Link2 size={14} />}
                      onClick={() => connectMutation.mutate(pid)}
                      loading={connectMutation.isPending}
                    >
                      {t('settings.connect', 'Connect')}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Account & data */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {t('settings.accountData', 'Account & Data')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t(
                'settings.accountDataDesc',
                'Download a copy of your data or permanently delete your account.',
              )}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('settings.exportTitle', 'Export account data')}
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t(
                'settings.exportDesc',
                'Download your account profile, settings, content history, billing records, and connected platform metadata as JSON.',
              )}
            </p>
            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={handleExportData}
                loading={isExporting}
                icon={<Download size={16} />}
              >
                {t('settings.exportAction', 'Download export')}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-4">
            <h4 className="text-sm font-medium text-red-700 dark:text-red-300">
              {t('settings.deleteAccountTitle', 'Delete account')}
            </h4>
            <p className="mt-1 text-sm text-red-600/90 dark:text-red-300/80">
              {t(
                'settings.deleteAccountDesc',
                'This permanently removes your PostCommander account, generated content, settings, and active application access. Limited billing audit records may be retained for support and compliance. Enter your password and type DELETE to continue.',
              )}
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('settings.deletePassword', 'Current password')}
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder={t('settings.deletePasswordPlaceholder', 'Enter your password')}
              />
              <Input
                label={t('settings.deleteConfirmation', 'Confirmation')}
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                loading={isDeletingAccount}
                disabled={deletePassword.length === 0 || deleteConfirmation !== 'DELETE'}
                icon={<Trash2 size={16} />}
              >
                {t('settings.deleteAccountAction', 'Delete account')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Team / Workspace Management */}
      <WorkspaceManager />

      {/* Save button */}
      <div className="flex justify-end pb-6">
        <Button
          onClick={handleSave}
          loading={updateSettingsMutation.isPending}
          icon={<Save size={18} />}
          size="lg"
        >
          {t('settings.save', 'Save Settings')}
        </Button>
      </div>
    </div>
  );
}
