'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { api } from '~/utils/trpc';
import { formatCurrency, formatDate } from '~/lib/utils';

export const dynamic = 'force-dynamic';

function PaymentSuccessPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('paymentId');

  // Fetch payment details
  const { data: payment, isLoading } = api.payment.getById.useQuery(
    { id: paymentId! },
    { enabled: !!paymentId }
  );

  // Confetti effect (optional - you can add confetti library later)
  useEffect(() => {
    // Could add confetti animation here
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="mb-4 text-lg font-semibold text-red-600">Payment not found</p>
            <Button onClick={() => router.push('/')}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-12">
      <div className="container mx-auto max-w-2xl px-4">
        {/* Success Animation */}
        <div className="mb-8 text-center">
          <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-green-500 animate-bounce">
            <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-lg text-gray-600">Your booking has been confirmed</p>
        </div>

        {/* Payment Details */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Status */}
              <div className="rounded-lg bg-green-50 p-4 text-center border-2 border-green-200">
                <div className="flex items-center justify-center gap-2 text-green-800 font-semibold">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Payment Confirmed
                </div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-semibold">
                    {payment.method === 'BKASH' ? 'bKash' : payment.method === 'NAGAD' ? 'Nagad' : 'Bank Transfer'}
                  </span>
                </div>

                {payment.transactionId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="font-mono font-semibold">{payment.transactionId}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Date</span>
                  <span className="font-semibold">{formatDate(payment.createdAt)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Booking ID</span>
                  <span className="font-mono font-semibold">{payment.bookingId.slice(0, 12)}...</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Notice */}
        <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-2">📧 Confirmation Email Sent</h3>
            <p className="text-sm text-blue-700 mb-3">
              We've sent a confirmation email with your booking details and receipt. 
              Please check your inbox and spam folder.
            </p>
            <div className="text-xs text-blue-600 space-y-1">
              <p>✓ Booking confirmation</p>
              <p>✓ Payment receipt</p>
              <p>✓ Hotel contact details</p>
              <p>✓ Check-in instructions</p>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✓ Your booking is confirmed and saved</p>
              <p>✓ The hotel has been notified of your reservation</p>
              <p>✓ You can view your booking anytime in your profile</p>
              <p>✓ You'll receive a reminder email 24 hours before check-in</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href={`/bookings/${payment.bookingId}`} className="block">
            <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
              View Booking Details
            </Button>
          </Link>
          
          <Link href="/profile" className="block">
            <Button variant="outline" className="w-full" size="lg">
              Go to My Bookings
            </Button>
          </Link>

          <Link href="/" className="block">
            <Button variant="ghost" className="w-full">
              Continue Browsing Hotels
            </Button>
          </Link>
        </div>

        {/* Support */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Need help? Contact us at <a href="mailto:support@hotelbooking.com" className="text-blue-600 hover:underline">support@hotelbooking.com</a></p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
            <p className="text-gray-600">Loading payment details...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessPageInner />
    </Suspense>
  );
}
