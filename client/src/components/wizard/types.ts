import type { ReactNode } from 'react';

export interface WizardStepContext<TData> {
  data: TData;
  setData: (updates: Partial<TData>) => void;
  errors: Record<string, string>;
  goNext: () => void;
  goPrev: () => void;
}

export interface WizardStep<TData = Record<string, any>> {
  key: string;
  title: string;
  subtitle?: string;
  helpTitle?: string;
  helpContent?: ReactNode;
  canSkip?: boolean;
  validate?: (data: TData) => Record<string, string> | null;
  render: (ctx: WizardStepContext<TData>) => ReactNode;
}

export type AssistFieldKey =
  | 'topic'
  | 'audience'
  | 'tone'
  | 'hook'
  | 'cta'
  | 'goal'
  | 'icp_industry'
  | 'icp_role'
  | 'icp_region'
  | 'outreach_message'
  | 'blog_title'
  | 'blog_outline'
  | 'blog_topic';
