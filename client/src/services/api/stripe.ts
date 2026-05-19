import type { ApiResponse } from '@postcommander/shared';
import { api } from './_client.js';

export interface SubscriptionInfo {
  id: string;
  plan: string;
  interval: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
}

export interface SubscriptionStatus {
  plan: string;
  planName: string;
  status: string;
  postsUsed: number;
  postsLimit: number;
  aiProviders: number;
  platforms: number;
  features: string[];
  subscription: SubscriptionInfo | null;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  url: string | null;
  pdf: string | null;
}

export interface PlanInfo {
  id: string;
  name: string;
  postsPerMonth: number;
  aiProviders: number;
  platforms: number;
  features: string[];
  prices?: {
    month: { amount: number; currency: string };
    year: { amount: number; currency: string };
  };
}

export async function createCheckout(plan: string, interval: string): Promise<{ url: string }> {
  const { data } = await api.post<ApiResponse<{ url: string }>>('/stripe/create-checkout', {
    plan,
    interval,
  });
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to create checkout');
  return data.data;
}

export async function createPortal(): Promise<{ url: string }> {
  const { data } = await api.post<ApiResponse<{ url: string }>>('/stripe/create-portal', {});
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to create portal session');
  return data.data;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const { data } = await api.get<ApiResponse<SubscriptionStatus>>('/stripe/subscription');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to get subscription');
  return data.data;
}

export async function cancelSubscription(): Promise<{ message: string }> {
  const { data } = await api.post<ApiResponse<{ message: string }>>('/stripe/cancel', {});
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to cancel subscription');
  return data.data;
}

export async function resumeSubscription(): Promise<{ message: string }> {
  const { data } = await api.post<ApiResponse<{ message: string }>>('/stripe/resume', {});
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to resume subscription');
  return data.data;
}

export async function getInvoices(): Promise<{ invoices: Invoice[] }> {
  const { data } = await api.get<ApiResponse<{ invoices: Invoice[] }>>('/stripe/invoices');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to get invoices');
  return data.data;
}

export async function getPlans(): Promise<PlanInfo[]> {
  const { data } = await api.get<ApiResponse<PlanInfo[]>>('/stripe/plans');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to get plans');
  return data.data;
}
