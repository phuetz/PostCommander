import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Crown,
  Zap,
  Check,
  AlertTriangle,
  Download,
  ExternalLink,
  RefreshCw,
  Loader2,
  XCircle,
  ChevronRight,
  Sparkles,
  BarChart3,
  Shield,
} from 'lucide-react';
import clsx from 'clsx';
import {
  getSubscriptionStatus,
  cancelSubscription,
  resumeSubscription,
  getInvoices,
  createCheckout,
  createPortal,
  type SubscriptionStatus,
  type Invoice,
} from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

function getBillingErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function normalizeBillingError(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object'
  ) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    if (response?.data?.error) {
      return response.data.error;
    }
  }

  return getBillingErrorMessage(error, fallback);
}

/* ------------------------------------------------------------------ */
/*  Helper: format cents to EUR                                        */
/* ------------------------------------------------------------------ */
function formatAmount(cents: number, currency: string = 'eur', locale: string = 'en-EU'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/* ------------------------------------------------------------------ */
/*  Helper: format date                                                */
/* ------------------------------------------------------------------ */
function formatDate(dateStr: string | null, locale: string = 'en-US'): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */
function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const styles: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    trialing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    past_due: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    canceled: 'bg-red-500/10 text-red-400 border-red-500/20',
    paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    open: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    void: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        styles[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      )}
    >
      {t(
        `history.${status}`,
        status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Plan icon                                                          */
/* ------------------------------------------------------------------ */
function PlanIcon({ plan }: { plan: string }) {
  if (plan === 'business') {
    return (
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
        <Crown size={24} className="text-white" />
      </div>
    );
  }
  if (plan === 'pro') {
    return (
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
        <Zap size={24} className="text-white" />
      </div>
    );
  }
  return (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
      <Sparkles size={24} className="text-white" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Usage progress bar                                                 */
/* ------------------------------------------------------------------ */
function UsageBar({ used, limit }: { used: number; limit: number }) {
  const { t } = useTranslation();
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-400">{t('billing.postsThisMonth')}</span>
        <span
          className={clsx(
            'text-sm font-medium',
            isAtLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-gray-300',
          )}
        >
          {used} / {isUnlimited ? t('billing.unlimited') : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-500',
              isAtLimit
                ? 'bg-red-500'
                : isNearLimit
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500',
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isUnlimited && (
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 w-full opacity-30" />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cancel confirmation modal                                          */
/* ------------------------------------------------------------------ */
function CancelModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">{t('billing.cancelModalTitle')}</h3>
        </div>
        <p className="text-gray-400 text-sm mb-6">{t('billing.cancelModalText')}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
          >
            {t('billing.keepSubscription')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {t('billing.cancelSubscription')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BillingPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const isSuccess = searchParams.get('success') === 'true';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subData, invoiceData] = await Promise.all([getSubscriptionStatus(), getInvoices()]);
      setSubscription(subData);
      setInvoices(invoiceData.invoices);
    } catch (err: unknown) {
      setError(normalizeBillingError(err, t('billing.loadError')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setSubscription(null);
      setInvoices([]);
      setLoading(false);
    }
  }, [user, loadData]);

  useEffect(() => {
    if (isSuccess) {
      setSuccessMessage(t('billing.paymentSuccess'));
      const timer = setTimeout(() => setSuccessMessage(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, t]);

  const handleUpgrade = async (plan: 'pro' | 'business', interval: 'month' | 'year') => {
    setCheckoutLoading(`${plan}_${interval}`);
    try {
      const { url } = await createCheckout(plan, interval);
      window.location.href = url;
    } catch (err: unknown) {
      setError(normalizeBillingError(err, t('billing.checkoutError')));
      setCheckoutLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setActionLoading(true);
    try {
      const { url } = await createPortal();
      window.location.href = url;
    } catch (err: unknown) {
      setError(normalizeBillingError(err, t('billing.portalError')));
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await cancelSubscription();
      setSuccessMessage(t('billing.cancelSuccess'));
      setCancelModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(normalizeBillingError(err, t('billing.cancelError')));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await resumeSubscription();
      setSuccessMessage(t('billing.resumeSuccess'));
      await loadData();
    } catch (err: unknown) {
      setError(normalizeBillingError(err, t('billing.resumeError')));
    } finally {
      setActionLoading(false);
    }
  };

  const isFreePlan = !subscription || subscription.plan === 'free';
  const isPaidPlan =
    subscription && (subscription.plan === 'pro' || subscription.plan === 'business');
  const isCanceling = subscription?.subscription?.cancelAtPeriodEnd;

  const currentLocale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('billing.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('billing.subtitle')}</p>
        </div>
        {user && (
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <RefreshCw size={14} />
            {t('billing.refresh')}
          </button>
        )}
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Check size={18} className="text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300">{successMessage}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <XCircle size={18} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-gray-500" />
        </div>
      ) : (
        <>
          {/* Current Plan & Usage */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Current Plan Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <PlanIcon plan={subscription?.plan || 'free'} />
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {subscription?.planName || t('billing.freePlan')}
                    </h2>
                    <StatusBadge status={subscription?.status || 'active'} />
                  </div>
                </div>
              </div>

              {/* Plan Stats */}
              <div className="space-y-4">
                <UsageBar
                  used={subscription?.postsUsed || 0}
                  limit={subscription?.postsLimit ?? 10}
                />
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={14} className="text-gray-500" />
                    <span className="text-sm text-gray-400">
                      {subscription?.aiProviders || 1}{' '}
                      {t('billing.aiProvider', { count: subscription?.aiProviders || 1 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-gray-500" />
                    <span className="text-sm text-gray-400">
                      {subscription?.platforms || 2}{' '}
                      {t('billing.platform', { count: subscription?.platforms || 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscription info */}
              {isPaidPlan && subscription?.subscription && (
                <div className="mt-6 pt-4 border-t border-gray-800 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('billing.billingInterval')}</span>
                    <span className="text-gray-300 capitalize">
                      {t(
                        `pricing.${subscription.subscription.interval}`,
                        subscription.subscription.interval,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('billing.nextBillingDate')}</span>
                    <span className="text-gray-300">
                      {formatDate(subscription.subscription.currentPeriodEnd, currentLocale)}
                    </span>
                  </div>
                  {isCanceling && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs text-amber-400">
                        {t('billing.cancelNotice', {
                          date: formatDate(
                            subscription.subscription.currentPeriodEnd,
                            currentLocale,
                          ),
                        })}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">
                {t('billing.quickActions')}
              </h3>
              <div className="space-y-3">
                {isFreePlan && (
                  <>
                    <button
                      onClick={() => handleUpgrade('pro', 'month')}
                      disabled={!!checkoutLoading}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Zap size={18} className="text-blue-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-white">
                            {t('billing.upgradePro')}
                          </p>
                          <p className="text-xs text-gray-400">{t('billing.proDesc')}</p>
                        </div>
                      </div>
                      {checkoutLoading === 'pro_month' ? (
                        <Loader2 size={16} className="animate-spin text-blue-400" />
                      ) : (
                        <ChevronRight
                          size={16}
                          className="text-gray-500 group-hover:text-blue-400 transition-colors"
                        />
                      )}
                    </button>
                    <button
                      onClick={() => handleUpgrade('pro', 'year')}
                      disabled={!!checkoutLoading}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-gray-800 hover:border-blue-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Zap size={18} className="text-blue-400/60" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-300">
                            {t('billing.proYearly')}
                          </p>
                          <p className="text-xs text-gray-500">{t('billing.proYearlyDesc')}</p>
                        </div>
                      </div>
                      {checkoutLoading === 'pro_year' ? (
                        <Loader2 size={16} className="animate-spin text-blue-400" />
                      ) : (
                        <ChevronRight
                          size={16}
                          className="text-gray-600 group-hover:text-blue-400 transition-colors"
                        />
                      )}
                    </button>
                    <button
                      onClick={() => handleUpgrade('business', 'month')}
                      disabled={!!checkoutLoading}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Crown size={18} className="text-violet-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-white">
                            {t('billing.upgradeBusiness')}
                          </p>
                          <p className="text-xs text-gray-400">{t('billing.businessDesc')}</p>
                        </div>
                      </div>
                      {checkoutLoading === 'business_month' ? (
                        <Loader2 size={16} className="animate-spin text-violet-400" />
                      ) : (
                        <ChevronRight
                          size={16}
                          className="text-gray-500 group-hover:text-violet-400 transition-colors"
                        />
                      )}
                    </button>
                    <button
                      onClick={() => handleUpgrade('business', 'year')}
                      disabled={!!checkoutLoading}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-violet-500/5 to-purple-500/5 border border-gray-800 hover:border-violet-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Crown size={18} className="text-violet-400/60" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-300">
                            {t('billing.businessYearly')}
                          </p>
                          <p className="text-xs text-gray-500">{t('billing.businessYearlyDesc')}</p>
                        </div>
                      </div>
                      {checkoutLoading === 'business_year' ? (
                        <Loader2 size={16} className="animate-spin text-violet-400" />
                      ) : (
                        <ChevronRight
                          size={16}
                          className="text-gray-600 group-hover:text-violet-400 transition-colors"
                        />
                      )}
                    </button>
                  </>
                )}

                {isPaidPlan && (
                  <>
                    <button
                      onClick={handleManageBilling}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-800 border border-gray-700 hover:border-gray-600 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard size={18} className="text-gray-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-white">
                            {t('billing.manageSubscription')}
                          </p>
                          <p className="text-xs text-gray-400">
                            {t('billing.manageSubscriptionDesc')}
                          </p>
                        </div>
                      </div>
                      {actionLoading ? (
                        <Loader2 size={16} className="animate-spin text-gray-400" />
                      ) : (
                        <ExternalLink
                          size={16}
                          className="text-gray-500 group-hover:text-white transition-colors"
                        />
                      )}
                    </button>

                    {isCanceling ? (
                      <button
                        onClick={handleResume}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <RefreshCw size={18} className="text-emerald-400" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-emerald-300">
                              {t('billing.resumeSubscription')}
                            </p>
                            <p className="text-xs text-gray-400">
                              {t('billing.resumeSubscriptionDesc')}
                            </p>
                          </div>
                        </div>
                        {actionLoading ? (
                          <Loader2 size={16} className="animate-spin text-emerald-400" />
                        ) : (
                          <ChevronRight
                            size={16}
                            className="text-gray-500 group-hover:text-emerald-400 transition-colors"
                          />
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => setCancelModalOpen(true)}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-800 hover:border-red-500/30 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <XCircle
                            size={18}
                            className="text-gray-500 group-hover:text-red-400 transition-colors"
                          />
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-400 group-hover:text-red-400 transition-colors">
                              {t('billing.cancelSubscription')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {t('billing.cancelSubscriptionDesc')}
                            </p>
                          </div>
                        </div>
                      </button>
                    )}
                  </>
                )}

                <div className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{t('billing.billingEmail')}:</span>
                    <span className="text-xs text-gray-300">
                      {user?.email || t('billing.notSet')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice History */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-4">
              {t('billing.invoiceHistory')}
            </h3>
            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard size={32} className="text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">{t('billing.noInvoices')}</p>
                <p className="text-xs text-gray-500 mt-1">{t('billing.noInvoicesDesc')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-800">
                      <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('billing.date')}
                      </th>
                      <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('billing.amount')}
                      </th>
                      <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('billing.status')}
                      </th>
                      <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                        {t('billing.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 text-gray-300">
                          {formatDate(invoice.date, currentLocale)}
                        </td>
                        <td className="py-3 text-gray-300 font-medium">
                          {formatAmount(invoice.amount, invoice.currency, currentLocale)}
                        </td>
                        <td className="py-3">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {invoice.url && (
                              <a
                                href={invoice.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
                                title={t('billing.viewInvoice')}
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                            {invoice.pdf && (
                              <a
                                href={invoice.pdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
                                title={t('billing.downloadPdf')}
                              >
                                <Download size={14} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <CancelModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancel}
        loading={actionLoading}
      />
    </div>
  );
}
