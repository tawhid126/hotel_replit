'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';

export const dynamic = 'force-dynamic';

function SignInPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const callbackUrl = searchParams.get('callbackUrl');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect based on role after successful login
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = session.user.role;
      
      if (callbackUrl) {
        router.push(callbackUrl);
      } else if (role === 'ADMIN') {
        router.push('/admin');
      } else if (role === 'HOTEL_OWNER') {
        router.push('/hotel-owner/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [status, session, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        // Wait for session to be set, then useEffect will handle redirect
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold">Sign In</CardTitle>
          <p className="mt-2 text-center text-gray-600">
            Welcome back! Sign in to your account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Sign In
            </Button>

            <div className="mt-4 space-y-3">
              <div className="text-center text-sm text-gray-600">
                <p>Don't have an account?{' '}
                  <Link 
                    href="/auth/signup" 
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Sign Up
                  </Link>
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-500">or</span>
                </div>
              </div>

              <div className="text-center text-sm">
                <p className="text-gray-600">
                  Are you an admin or hotel owner?{' '}
                  <Link 
                    href="/admin/login" 
                    className="font-medium text-purple-600 hover:text-purple-500"
                  >
                    Login here →
                  </Link>
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 text-xs space-y-1">
                <p className="font-semibold text-gray-700">For Testing:</p>
                <div className="font-mono text-gray-600 space-y-1">
                  <p><strong>Admin:</strong> tawhidur_rahman@hotel.com / tawhiD20123894</p>
                  <p><strong>Customer:</strong> customer@hotel.com / admin123</p>
                  <p className="text-yellow-700">
                    <strong>Hotel Owner:</strong> Create via admin panel
                  </p>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-gray-600">Loading sign in...</p>
          </div>
        </div>
      }
    >
      <SignInPageInner />
    </Suspense>
  );
}
