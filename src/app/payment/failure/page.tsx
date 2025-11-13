'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { Card, CardContent } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { api } from '~/utils/trpc';

export const dynamic = 'force-dynamic';

function PaymentFailurePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('paymentId');

  // Fetch payment details
  const { data: payment, isLoading } = api.payment.getById.useQuery(
    { id: paymentId! },
    { enabled: !!paymentId }
  );

  const handleRetry = () => {
    if (payment) {
      // Determine which payment page to redirect to based on method
      if (payment.method === 'BKASH') {
        router.push(`/payment/bkash?paymentId=${paymentId}`);
      } else if (payment.method === 'NAGAD') {
        router.push(`/payment/nagad?paymentId=${paymentId}`);
      } else if (payment.method === 'BANK') {
        router.push(`/payment/bank?paymentId=${paymentId}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 py-12">
      <div className="container mx-auto max-w-2xl px-4">
        {/* Error Icon */}
        <div className="mb-8 text-center">
          <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-red-500">
            <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-lg text-gray-600">We couldn't process your payment</p>
        </div>

        {/* Error Details */}
        <Card className="mb-6 border-2 border-red-200">
          <CardContent className="p-6">
            <div className="rounded-lg bg-red-50 p-4 mb-4">
              <h3 className="font-semibold text-red-900 mb-2">❌ Transaction Failed</h3>
              <p className="text-sm text-red-700">
                Your payment could not be completed. Please check the details below and try again.
              </p>
            </div>

            {payment && (
              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-semibold">
                    {payment.method === 'BKASH' ? 'bKash' : payment.method === 'NAGAD' ? 'Nagad' : 'Bank Transfer'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID</span>
                  <span className="font-mono text-sm">{payment.id.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="font-semibold text-red-600">Failed</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Possible Reasons */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Common Reasons for Payment Failure:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Insufficient balance in your account</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Incorrect PIN or account details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Network or connectivity issues</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Payment gateway temporarily unavailable</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Transaction limit exceeded</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* What to Do Next */}
        <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-2">💡 What Should You Do?</h3>
            <ol className="space-y-2 text-sm text-blue-700">
              <li>1. Check your account balance and payment details</li>
              <li>2. Ensure you have a stable internet connection</li>
              <li>3. Try again with the same or different payment method</li>
              <li>4. If the problem persists, contact your payment provider</li>
            </ol>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700" 
            size="lg"
          >
            Try Again
          </Button>

          {payment && (
            <Link href={`/bookings/${payment.bookingId}`} className="block">
              <Button variant="outline" className="w-full" size="lg">
                Choose Different Payment Method
              </Button>
            </Link>
          )}

          <Link href="/profile" className="block">
            <Button variant="ghost" className="w-full">
              Go to My Bookings
            </Button>
          </Link>
        </div>

        {/* Support */}
        <div className="mt-8 rounded-lg bg-white p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-sm text-gray-600 mb-4">
            If you continue to experience issues, please contact our support team
          </p>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-600">Email:</span>{' '}
              <a href="mailto:support@hotelbooking.com" className="text-blue-600 hover:underline">
                support@hotelbooking.com
              </a>
            </p>
            <p>
              <span className="text-gray-600">Phone:</span>{' '}
              <a href="tel:+8801234567890" className="text-blue-600 hover:underline">
                +880 1234-567890
              </a>
            </p>
            <p className="text-gray-500">Available 24/7</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentFailurePageInner />
    </Suspense>
  );
}
