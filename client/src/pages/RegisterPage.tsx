import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { createCheckout } from '@/services/api';

function getRegistrationErrorMessage(error: unknown): string {
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

  return error instanceof Error ? error.message : 'Registration failed';
}

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, name);

      const plan = searchParams.get('plan');
      const interval = searchParams.get('interval');
      if (
        (plan === 'pro' || plan === 'business') &&
        (interval === 'month' || interval === 'year')
      ) {
        const { url } = await createCheckout(plan, interval);
        window.location.assign(url);
        return;
      }

      toast.success('Account created! Welcome to PostCommander.');
      navigate('/app/dashboard');
    } catch (error: unknown) {
      console.error('Registration failed:', error);
      toast.error(getRegistrationErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-primary)] px-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-display font-bold text-[var(--color-text-primary)] mb-2">
            Create Account
          </h1>
          <p className="text-[var(--color-text-muted)]">
            Start growing your audience with AI-powered posts
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
            disabled={isLoading}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            disabled={isLoading}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading}
          />

          <Button type="submit" className="w-full" loading={isLoading}>
            Sign Up
          </Button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-[var(--color-text-muted)]">Already have an account? </span>
          <Link
            to="/login"
            className="text-[var(--color-accent-violet)] hover:underline font-medium"
          >
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
