'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { api } from '~/utils/trpc';
import { formatCurrency } from '~/lib/utils';

export const dynamic = 'force-dynamic';

function BankPaymentPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('paymentId');

  const [formData, setFormData] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    branchName: '',
    transactionRef: '',
  });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!formData.accountName || !formData.accountNumber || !formData.bankName || !formData.transactionRef) {
      setError('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);

    try {
      // In production, this would verify with bank API
      // For now, we'll simulate the verification
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Use transaction ref as transaction ID
      const transactionId = `BANK${formData.transactionRef}`;

      // Update payment status
      updatePayment.mutate({
        paymentId: paymentId!,
        status: 'COMPLETED',
        transactionId,
      });
    } catch (err) {
      setError('Payment verification failed. Please check your details and try again.');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12">
      <div className="container mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-600">
            <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Bank Transfer</h1>
          <p className="mt-2 text-gray-600">Complete payment via direct bank transfer</p>
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
                <span className="text-2xl font-bold text-blue-600">
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

        {/* Our Bank Details */}
        <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Transfer to This Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">Account Name:</span>
                <span className="font-semibold text-blue-900">Hotel Booking Ltd</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">Account Number:</span>
                <span className="font-semibold text-blue-900 font-mono">1234567890123</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">Bank Name:</span>
                <span className="font-semibold text-blue-900">Dutch Bangla Bank</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">Branch:</span>
                <span className="font-semibold text-blue-900">Gulshan, Dhaka</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">Routing Number:</span>
                <span className="font-semibold text-blue-900">090271560</span>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-blue-100 p-3 text-xs text-blue-800">
              <p className="font-semibold mb-1">📝 Important:</p>
              <p>Please use your Payment ID ({payment.id.slice(0, 12)}...) as the reference when making the transfer.</p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Enter Transfer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Name */}
              <div>
                <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Account Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="accountName"
                  name="accountName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.accountName}
                  onChange={handleChange}
                  required
                  disabled={isProcessing}
                />
              </div>

              {/* Account Number */}
              <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Account Number <span className="text-red-500">*</span>
                </label>
                <Input
                  id="accountNumber"
                  name="accountNumber"
                  type="text"
                  placeholder="1234567890"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  required
                  disabled={isProcessing}
                />
              </div>

              {/* Bank Name */}
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Bank Name <span className="text-red-500">*</span>
                </label>
                <select
                  id="bankName"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  required
                  disabled={isProcessing}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select your bank</option>
                  <option value="Dutch Bangla Bank">Dutch Bangla Bank</option>
                  <option value="Brac Bank">Brac Bank</option>
                  <option value="City Bank">City Bank</option>
                  <option value="Eastern Bank">Eastern Bank</option>
                  <option value="HSBC">HSBC</option>
                  <option value="Islami Bank">Islami Bank</option>
                  <option value="Jamuna Bank">Jamuna Bank</option>
                  <option value="Prime Bank">Prime Bank</option>
                  <option value="Standard Chartered">Standard Chartered</option>
                  <option value="United Commercial Bank">United Commercial Bank</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Branch Name */}
              <div>
                <label htmlFor="branchName" className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Name (Optional)
                </label>
                <Input
                  id="branchName"
                  name="branchName"
                  type="text"
                  placeholder="Gulshan Branch"
                  value={formData.branchName}
                  onChange={handleChange}
                  disabled={isProcessing}
                />
              </div>

              {/* Transaction Reference */}
              <div>
                <label htmlFor="transactionRef" className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Reference <span className="text-red-500">*</span>
                </label>
                <Input
                  id="transactionRef"
                  name="transactionRef"
                  type="text"
                  placeholder="TXN123456789"
                  value={formData.transactionRef}
                  onChange={handleChange}
                  required
                  disabled={isProcessing}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the transaction reference number from your bank receipt
                </p>
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
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Verifying Payment...
                  </>
                ) : (
                  'Confirm Payment'
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
            <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm">
              <p className="font-semibold text-blue-900 mb-1">🔒 Secure Transaction</p>
              <p className="text-blue-700 text-xs">
                Your payment will be verified by our team. You'll receive confirmation within 24 hours.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">How to pay via Bank Transfer:</h3>
            <ol className="space-y-1 text-sm text-gray-600">
              <li>1. Transfer the exact amount to our bank account (details above)</li>
              <li>2. Use your Payment ID as reference</li>
              <li>3. Fill in this form with your transfer details</li>
              <li>4. Keep your transaction receipt for verification</li>
              <li>5. We'll confirm your booking within 24 hours</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function BankPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-gray-600">Loading payment page...</p>
          </div>
        </div>
      }
    >
      <BankPaymentPageInner />
    </Suspense>
  );
}
