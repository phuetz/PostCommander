export interface UserRow {
  id: string;
  email: string;
  password_hash?: string;
  name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  plan: 'free' | 'pro' | 'business';
  plan_status: 'active' | 'past_due' | 'canceled' | 'trialing';
  posts_used_this_month: number;
  posts_reset_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  plan: 'pro' | 'business';
  interval: 'month' | 'year';
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: number; // 0 or 1
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceRow {
  id: string;
  user_id: string;
  stripe_invoice_id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'draft' | 'uncollectible';
  invoice_url: string | null;
  invoice_pdf: string | null;
  created_at: string;
}

export interface PlatformConnectionRow {
  id: string;
  user_id: string | null;
  platform: string;
  account_name: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires: string | null;
  scopes: string | null;
  metadata: string | null;
  connected_at: string;
  updated_at: string;
}

export interface PostRow {
  id: string;
  user_id: string | null;
  content: string;
  original_prompt: string | null;
  tone: string | null;
  llm_provider: string | null;
  llm_model: string | null;
  platforms: string; // JSON array string
  platform_variants: string | null; // JSON object string
  hashtags: string | null; // JSON array string
  status: 'draft' | 'scheduled' | 'published';
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
