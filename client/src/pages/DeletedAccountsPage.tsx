import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Shield,
  Receipt,
  Trash2,
  UserRound,
  RefreshCw,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';
import { getDeletedAccounts } from '@/services/api';
import type { DeletedAccountAudit } from '@postcommander/shared';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

type SearchMode = 'latest' | 'email' | 'originalUserId' | 'stripeCustomerId';

const searchModes: SearchMode[] = ['latest', 'email', 'originalUserId', 'stripeCustomerId'];

function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'active' || status === 'paid') return 'success';
  if (status === 'canceled') return 'default';
  if (status === 'past_due') return 'warning';
  if (status === 'trialing') return 'info';
  return 'default';
}

export function DeletedAccountsPage() {
  const { t } = useTranslation();
  const [searchMode, setSearchMode] = useState<SearchMode>('latest');
  const [searchValue, setSearchValue] = useState('');
  const [submittedFilters, setSubmittedFilters] = useState<{
    email?: string;
    originalUserId?: string;
    stripeCustomerId?: string;
    limit: number;
  }>({ limit: 25 });

  const query = useQuery({
    queryKey: ['admin', 'deleted-accounts', submittedFilters],
    queryFn: () => getDeletedAccounts(submittedFilters),
  });

  const getModeLabel = useMemo(
    () => (mode: SearchMode) => {
      if (mode === 'email') {
        return t('admin.deletedAccounts.mode.email', 'Email');
      }
      if (mode === 'originalUserId') {
        return t('admin.deletedAccounts.mode.originalUserId', 'Original User ID');
      }
      if (mode === 'stripeCustomerId') {
        return t('admin.deletedAccounts.mode.stripeCustomerId', 'Stripe Customer ID');
      }
      return t('admin.deletedAccounts.mode.latest', 'Latest deletions');
    },
    [t],
  );

  const activeSearchLabel = getModeLabel(searchMode);

  const exportBaseName = useMemo(() => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `deleted-accounts-${timestamp}`;
  }, []);

  const handleSearch = () => {
    const trimmed = searchValue.trim();
    if (searchMode === 'latest') {
      setSubmittedFilters({ limit: 25 });
      return;
    }

    setSubmittedFilters({
      limit: 25,
      ...(searchMode === 'email' ? { email: trimmed } : {}),
      ...(searchMode === 'originalUserId' ? { originalUserId: trimmed } : {}),
      ...(searchMode === 'stripeCustomerId' ? { stripeCustomerId: trimmed } : {}),
    });
  };

  const downloadBlob = (filename: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const buildCsv = (audits: DeletedAccountAudit[]) => {
    const rows = audits.flatMap((audit) => {
      if (audit.billingRecords.length === 0) {
        return [
          [
            audit.originalUserId,
            audit.deletedAt,
            audit.plan,
            audit.planStatus,
            audit.stripeCustomerId ?? '',
            audit.emailHash,
            '',
            '',
            '',
            audit.snapshot.contentCounts.posts,
            audit.snapshot.billingCounts.invoices,
            audit.snapshot.billingCounts.subscriptions,
          ],
        ];
      }

      return audit.billingRecords.map((record) => [
        audit.originalUserId,
        audit.deletedAt,
        audit.plan,
        audit.planStatus,
        audit.stripeCustomerId ?? '',
        audit.emailHash,
        record.recordType,
        record.stripeRecordId,
        record.status,
        audit.snapshot.contentCounts.posts,
        audit.snapshot.billingCounts.invoices,
        audit.snapshot.billingCounts.subscriptions,
      ]);
    });

    const headers = [
      'original_user_id',
      'deleted_at',
      'plan',
      'plan_status',
      'stripe_customer_id',
      'email_hash',
      'billing_record_type',
      'billing_record_id',
      'billing_record_status',
      'post_count',
      'invoice_count',
      'subscription_count',
    ];

    const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    return [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  };

  const handleExportJson = () => {
    if (!query.data || query.data.length === 0) {
      return;
    }

    downloadBlob(
      `${exportBaseName}.json`,
      new Blob([JSON.stringify(query.data, null, 2)], { type: 'application/json' }),
    );
    toast.success(
      t('admin.deletedAccounts.exportJsonSuccess', 'Deleted account archives exported as JSON.'),
    );
  };

  const handleExportCsv = () => {
    if (!query.data || query.data.length === 0) {
      return;
    }

    downloadBlob(
      `${exportBaseName}.csv`,
      new Blob([buildCsv(query.data)], { type: 'text/csv;charset=utf-8' }),
    );
    toast.success(
      t('admin.deletedAccounts.exportCsvSuccess', 'Deleted account archives exported as CSV.'),
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <Card>
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t('admin.deletedAccounts.title', 'Deleted Account Archives')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t(
                    'admin.deletedAccounts.subtitle',
                    'Search archived deletion audits and billing traces retained for support, accounting, and fraud review.',
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">{t('admin.deletedAccounts.adminOnly', 'Admin only')}</Badge>
              <Badge variant="warning">
                {t('admin.deletedAccounts.retention', 'Read-only support archive')}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              icon={<FileJson size={16} />}
              onClick={handleExportJson}
              disabled={!query.data || query.data.length === 0}
            >
              {t('admin.deletedAccounts.exportJson', 'Export JSON')}
            </Button>
            <Button
              variant="secondary"
              icon={<FileSpreadsheet size={16} />}
              onClick={handleExportCsv}
              disabled={!query.data || query.data.length === 0}
            >
              {t('admin.deletedAccounts.exportCsv', 'Export CSV')}
            </Button>
            <Button
              variant="secondary"
              icon={<RefreshCw size={16} />}
              onClick={() => query.refetch()}
              loading={query.isFetching}
            >
              {t('admin.deletedAccounts.refresh', 'Refresh')}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-1 lg:grid-cols-[220px,1fr,auto] gap-4 items-end">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('admin.deletedAccounts.searchBy', 'Search by')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-2">
              {searchModes.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSearchMode(value);
                    setSearchValue('');
                  }}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                    searchMode === value
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                      : 'border-gray-200 text-gray-600 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-100'
                  }`}
                >
                  {getModeLabel(value)}
                </button>
              ))}
            </div>
          </div>

          <Input
            label={activeSearchLabel}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            disabled={searchMode === 'latest'}
            placeholder={
              searchMode === 'email'
                ? 'deleted@example.com'
                : searchMode === 'originalUserId'
                  ? t('admin.deletedAccounts.originalUserIdPlaceholder', 'user UUID')
                  : searchMode === 'stripeCustomerId'
                    ? 'cus_...'
                    : t('admin.deletedAccounts.latestPlaceholder', 'Latest 25 deletions')
            }
            icon={<Search size={16} />}
          />

          <Button
            onClick={handleSearch}
            icon={<Search size={16} />}
            disabled={searchMode !== 'latest' && searchValue.trim().length === 0}
          >
            {t('admin.deletedAccounts.search', 'Search')}
          </Button>
        </div>
      </Card>

      {query.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : query.isError ? (
        <Card>
          <p className="text-sm text-red-600 dark:text-red-400">
            {query.error instanceof Error
              ? query.error.message
              : t('admin.deletedAccounts.loadError', 'Failed to load deleted account archives.')}
          </p>
        </Card>
      ) : query.data && query.data.length > 0 ? (
        <div className="space-y-4">
          {query.data.map((audit) => (
            <Card key={audit.id} className="space-y-5">
              <div className="flex items-start justify-between gap-4 flex-col lg:flex-row">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="danger" dot>
                      {t('admin.deletedAccounts.deleted', 'Deleted')}
                    </Badge>
                    <Badge variant={getStatusVariant(audit.planStatus)}>{audit.planStatus}</Badge>
                    <Badge variant="default">{audit.plan}</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <p>
                      <span className="font-medium">
                        {t('admin.deletedAccounts.originalUserIdLabel', 'Original user ID')}:
                      </span>{' '}
                      {audit.originalUserId}
                    </p>
                    <p>
                      <span className="font-medium">
                        {t('admin.deletedAccounts.deletedAtLabel', 'Deleted at')}:
                      </span>{' '}
                      {new Date(audit.deletedAt).toLocaleString()}
                    </p>
                    {audit.stripeCustomerId && (
                      <p>
                        <span className="font-medium">
                          {t('admin.deletedAccounts.stripeCustomerLabel', 'Stripe customer')}:
                        </span>{' '}
                        {audit.stripeCustomerId}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">
                        {t('admin.deletedAccounts.emailHashLabel', 'Email hash')}:
                      </span>{' '}
                      {audit.emailHash.slice(0, 16)}...
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 min-w-[100px]">
                    <div className="flex items-center gap-2 text-gray-500">
                      <UserRound size={14} />
                      <span className="text-xs uppercase tracking-wide">
                        {t('admin.deletedAccounts.content', 'Content')}
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {audit.snapshot.contentCounts.posts}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('admin.deletedAccounts.posts', 'posts')}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 min-w-[100px]">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Receipt size={14} />
                      <span className="text-xs uppercase tracking-wide">
                        {t('admin.deletedAccounts.billing', 'Billing')}
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {audit.snapshot.billingCounts.invoices}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('admin.deletedAccounts.invoices', 'invoices')}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 min-w-[100px]">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Trash2 size={14} />
                      <span className="text-xs uppercase tracking-wide">
                        {t('admin.deletedAccounts.settings', 'Settings')}
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {audit.snapshot.contentCounts.settings}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('admin.deletedAccounts.entries', 'entries')}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 min-w-[100px]">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Shield size={14} />
                      <span className="text-xs uppercase tracking-wide">
                        {t('admin.deletedAccounts.platforms', 'Platforms')}
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {audit.snapshot.contentCounts.platformConnections}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('admin.deletedAccounts.connections', 'connections')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1fr,1.2fr] gap-4">
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {t('admin.deletedAccounts.userSnapshot', 'User Snapshot')}
                  </h3>
                  <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(audit.snapshot.user, null, 2)}
                  </pre>
                </div>

                <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {t('admin.deletedAccounts.billingArchive', 'Billing Archive')}
                  </h3>
                  {audit.billingRecords.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t(
                        'admin.deletedAccounts.noBillingRecords',
                        'No archived billing records for this account.',
                      )}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {audit.billingRecords.map((record) => (
                        <div
                          key={record.id}
                          className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge variant="info">{record.recordType}</Badge>
                            <Badge variant={getStatusVariant(record.status)}>{record.status}</Badge>
                            <span className="text-xs text-gray-500">{record.stripeRecordId}</span>
                          </div>
                          <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap break-all">
                            {JSON.stringify(record.snapshot, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('admin.deletedAccounts.empty', 'No deleted account archives matched your search.')}
          </p>
        </Card>
      )}
    </div>
  );
}
