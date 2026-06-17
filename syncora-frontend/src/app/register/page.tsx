'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(name, email, password);
      router.push('/dashboard/overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-syncora-50 to-white px-4 dark:from-syncora-950 dark:to-black">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <svg
            width="32"
            height="32"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect width="40" height="40" rx="8" fill="#7B2FF7" />
            <circle cx="20" cy="20" r="10" stroke="white" strokeWidth="2" />
            <circle cx="20" cy="20" r="3" fill="white" />
            <line x1="20" y1="6" x2="20" y2="14" stroke="white" strokeWidth="2" />
            <line x1="20" y1="26" x2="20" y2="34" stroke="white" strokeWidth="2" />
            <line x1="6" y1="20" x2="14" y2="20" stroke="white" strokeWidth="2" />
            <line x1="26" y1="20" x2="34" y2="20" stroke="white" strokeWidth="2" />
          </svg>
          <h1 className="text-xl font-bold">
            <span className="text-syncora-500">Sync</span>
            <span className="text-muted-foreground">ora</span>
          </h1>
          <p className="text-sm text-muted-foreground">Create your account</p>
        </div>

        {error && (
          <div
            className="flex items-center gap-2 rounded-md border border-red-400 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
            role="alert"
            aria-describedby="register-error"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span id="register-error">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-syncora-500 focus-visible:ring-offset-2"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-syncora-500 focus-visible:ring-offset-2"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-syncora-500 focus-visible:ring-offset-2"
            />
            <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-syncora-500 px-4 py-2 text-sm font-medium text-white hover:bg-syncora-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-syncora-500 focus-visible:ring-offset-2"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {'Already have an account? '}
          <Link href="/login" className="font-medium text-syncora-500 hover:text-syncora-600">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
