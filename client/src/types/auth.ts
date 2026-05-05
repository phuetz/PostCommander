export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'business';
  planStatus: 'active' | 'past_due' | 'canceled' | 'trialing';
  postsUsedThisMonth: number;
  postsResetDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
  };
  error?: string;
}
