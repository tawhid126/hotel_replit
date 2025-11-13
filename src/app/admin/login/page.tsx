'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified login page after 2 seconds
    const timer = setTimeout(() => {
      router.push('/auth/signin');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold">Admin Login</CardTitle>
          <p className="mt-2 text-center text-gray-600">
            Redirecting to unified login page...
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-blue-50 border-2 border-blue-200 p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl">ℹ️</span>
              <div>
                <h3 className="font-bold text-blue-900 text-lg mb-2">
                  Unified Login System
                </h3>
                <p className="text-blue-800 text-sm">
                  We now have a single login page for all users. You'll be automatically redirected based on your role:
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-blue-800 ml-10">
              <p>✅ <strong>Admin</strong> → Admin Dashboard (/admin)</p>
              <p>✅ <strong>Hotel Owner</strong> → Hotel Owner Dashboard</p>
              <p>✅ <strong>Customer</strong> → Homepage</p>
            </div>
          </div>

          <div className="rounded-lg bg-yellow-50 border border-yellow-300 p-4">
            <p className="font-semibold text-yellow-900 mb-2">🔐 Admin Credentials:</p>
            <div className="font-mono text-sm text-yellow-800 space-y-1">
              <p><strong>Email:</strong> tawhidur_rahman@hotel.com</p>
              <p><strong>Password:</strong> tawhiD20123894</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          <Button
            onClick={() => router.push('/auth/signin')}
            className="w-full bg-blue-600"
          >
            Go to Login Page Now →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
