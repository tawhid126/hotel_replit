'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { api } from '~/utils/trpc';
import { formatCurrency } from '~/lib/utils';

export const dynamic = 'force-dynamic';

function NagadPaymentPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('paymentId');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Fetch payment details
  const { data: payment, isLoading } = api.payment.getById.useQuery(
    { id: paymentId! },
    { enabled: !!paymentId }
  );

  // Update payment status mutation
  const updatePayment = api.payment.updateStatus.useMutation({
    onSuccess: () => {
      router.push(`/payment/success?paymentId=${paymentId}`);
    },
    onError: (error) => {
      setError(error.message);
      setIsProcessing(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber || phoneNumber.length !== 11) {
      setError('Please enter a valid 11-digit phone number');
      return;
    }

    if (!pin || pin.length < 4) {
      setError('Please enter your Nagad PIN');
      return;
    }

    setIsProcessing(true);

    try {
      // In production, this would call Nagad API
      // For now, we'll simulate the payment
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate transaction ID
      const transactionId = `NGD${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Update payment status
      updatePayment.mutate({
        paymentId: paymentId!,
        status: 'COMPLETED',
        transactionId,
      });
    } catch (err) {
      setError('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto mb-4" />
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-12">
      <div className="container mx-auto max-w-md px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-orange-500">
            <span className="text-3xl font-bold text-white">Nagad</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Nagad Payment</h1>
          <p className="mt-2 text-gray-600">Digital Financial Service</p>
        </div>

        {/* Payment Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount to Pay</span>
                <span className="text-2xl font-bold text-orange-600">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment ID</span>
                <span className="font-mono text-gray-900">{payment.id.slice(0, 12)}...</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Nagad Account Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  maxLength={11}
                  required
                  disabled={isProcessing}
                />
                <p className="mt-1 text-xs text-gray-500">Enter your 11-digit Nagad number</p>
              </div>

              {/* PIN */}
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
                  Nagad PIN
                </label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter your PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  required
                  disabled={isProcessing}
                />
                <p className="mt-1 text-xs text-gray-500">Enter your 4-digit PIN</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-orange-500 hover:bg-orange-600"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Processing Payment...
                  </>
                ) : (
                  `Pay ${formatCurrency(payment.amount)}`
                )}
              </Button>

              {/* Cancel */}
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={isProcessing}
                className="w-full"
              >
                Cancel
              </Button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 rounded-lg bg-orange-50 p-4 text-sm">
              <p className="font-semibold text-orange-900 mb-1">🔒 Secure Payment</p>
              <p className="text-orange-700 text-xs">
                Your payment is processed securely through Nagad. We never store your PIN.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">How to pay with Nagad:</h3>
            <ol className="space-y-1 text-sm text-gray-600">
              <li>1. Enter your Nagad registered mobile number</li>
              <li>2. Enter your Nagad PIN</li>
              <li>3. Click "Pay" to complete the transaction</li>
              <li>4. You'll receive a confirmation SMS from Nagad</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function NagadPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="text-gray-600">Loading payment page...</p>
          </div>
        </div>
      }
    >
      <NagadPaymentPageInner />
    </Suspense>
  );
}
