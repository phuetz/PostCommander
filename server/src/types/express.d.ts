declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'user' | 'admin';
        plan: 'free' | 'pro' | 'business';
        planStatus: 'active' | 'past_due' | 'canceled' | 'trialing';
        postsUsedThisMonth: number;
        postsResetDate: string | null;
      };
      workspaceId?: string;
      validatedQuery?: unknown;
    }
  }
}

export {};
