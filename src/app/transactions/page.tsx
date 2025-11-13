'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { Modal } from '~/components/ui/Modal';
import { api } from '~/utils/trpc';
import { formatCurrency } from '~/lib/utils';
import { jsPDF } from 'jspdf';

export default function TransactionHistoryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Redirect to signin if not authenticated (client-side only)
  useEffect(() => {
    if (!session) {
      router.push('/signin');
    }
  }, [session, router]);

  // Fetch user's transactions/payments
  const { data: transactions, isLoading } = api.payment.getByUserId.useQuery(
    session ? { userId: session.user.id } : ({} as any),
    { enabled: !!session }
  );

  // Filter transactions
  const filteredTransactions = transactions?.filter((transaction: any) => {
    const statusMatch = filterStatus === 'all' || transaction.status.toLowerCase() === filterStatus;
    const methodMatch = filterMethod === 'all' || transaction.method.toLowerCase() === filterMethod;
    return statusMatch && methodMatch;
  }) || [];

  // Calculate totals
  const totalSpent = transactions?.reduce((sum: number, t: any) => 
    t.status === 'COMPLETED' ? sum + t.amount : sum, 0) || 0;
  const totalTransactions = transactions?.length || 0;
  const successfulTransactions = transactions?.filter((t: any) => t.status === 'COMPLETED').length || 0;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'bkash':
        return '📱';
      case 'nagad':
        return '💳';
      case 'bank':
        return '🏦';
      default:
        return '💰';
    }
  };

  const generateInvoicePDF = (transaction: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(55, 119, 255);
    doc.text('HOTEL BOOKING SYSTEM', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Payment Invoice', pageWidth / 2, 45, { align: 'center' });
    
    // Invoice details
    doc.setFontSize(10);
    doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 20, 65);
    doc.text(`Transaction ID: ${transaction.transactionId || transaction.id}`, 20, 75);
    
    // Line
    doc.line(20, 85, pageWidth - 20, 85);
    
    // Customer info
    doc.setFontSize(12);
    doc.text('Bill To:', 20, 100);
    doc.setFontSize(10);
    doc.text(`${session?.user?.name}`, 20, 110);
    doc.text(`${session?.user?.email}`, 20, 120);
    
    // Booking info
    doc.setFontSize(12);
    doc.text('Booking Details:', 20, 140);
    doc.setFontSize(10);
    doc.text(`Hotel: ${transaction.booking?.hotel?.name || 'N/A'}`, 20, 150);
    doc.text(`Room: ${transaction.booking?.roomCategory?.name || 'N/A'}`, 20, 160);
    doc.text(`Check-in: ${transaction.booking?.checkInDate ? new Date(transaction.booking.checkInDate).toLocaleDateString() : 'N/A'}`, 20, 170);
    doc.text(`Check-out: ${transaction.booking?.checkOutDate ? new Date(transaction.booking.checkOutDate).toLocaleDateString() : 'N/A'}`, 20, 180);
    
    // Payment details
    doc.setFontSize(12);
    doc.text('Payment Information:', 20, 200);
    doc.setFontSize(10);
    doc.text(`Payment Method: ${transaction.method}`, 20, 210);
    doc.text(`Payment Date: ${new Date(transaction.createdAt).toLocaleDateString()}`, 20, 220);
    doc.text(`Status: ${transaction.status}`, 20, 230);
    
    // Amount
    doc.setFontSize(14);
    doc.setTextColor(34, 197, 94);
    doc.text(`Total Amount: ${formatCurrency(transaction.amount)}`, 20, 250);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('This is a computer-generated invoice. No signature required.', pageWidth / 2, 280, { align: 'center' });
    doc.text('For support, contact us at support@hotelbooking.com', pageWidth / 2, 290, { align: 'center' });
    
    // Save the PDF
    doc.save(`invoice-${transaction.id}.pdf`);
  };

  const handleDownloadInvoice = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsInvoiceModalOpen(true);
  };

  const confirmDownload = () => {
    if (selectedTransaction) {
      generateInvoicePDF(selectedTransaction);
      setIsInvoiceModalOpen(false);
      setSelectedTransaction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Transaction History</h1>
              <p className="mt-2 text-gray-600">
                View and manage your payment transactions
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/profile')}
            >
              Back to Profile
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(totalSpent)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                From successful payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {totalTransactions}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                All payment attempts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {totalTransactions > 0 ? Math.round((successfulTransactions / totalTransactions) * 100) : 0}%
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {successfulTransactions} of {totalTransactions} successful
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filter Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Payment Method Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Methods</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(filterStatus !== 'all' || filterMethod !== 'all') && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilterStatus('all');
                      setFilterMethod('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Payment History ({filteredTransactions.length} transactions)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-lg text-gray-600">No transactions found</p>
                <p className="text-sm text-gray-500">
                  {filterStatus !== 'all' || filterMethod !== 'all' 
                    ? 'Try changing your filters' 
                    : 'Make your first booking to see transactions here'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="rounded-lg border border-gray-200 p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      {/* Transaction Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{getMethodIcon(transaction.method)}</span>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {transaction.booking?.hotel?.name || 'Hotel Booking'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {transaction.booking?.roomCategory?.name || 'Room Booking'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Transaction ID:</span>
                            <p className="font-semibold text-gray-900 break-all">
                              {transaction.transactionId || transaction.id}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Payment Method:</span>
                            <p className="font-semibold text-gray-900">
                              {transaction.method}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Date:</span>
                            <p className="font-semibold text-gray-900">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Time:</span>
                            <p className="font-semibold text-gray-900">
                              {new Date(transaction.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Amount and Status */}
                      <div className="ml-6 text-right">
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          {formatCurrency(transaction.amount)}
                        </div>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                        {transaction.status === 'COMPLETED' && (
                          <div className="mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadInvoice(transaction)}
                            >
                              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download Invoice
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Download Confirmation Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Download Invoice
          </h2>
          
          {selectedTransaction && (
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Transaction ID:</span>
                    <p className="font-semibold">
                      {selectedTransaction.transactionId || selectedTransaction.id}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <p className="font-semibold">
                      {formatCurrency(selectedTransaction.amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <p className="font-semibold">
                      {new Date(selectedTransaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Method:</span>
                    <p className="font-semibold">
                      {selectedTransaction.method}
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600">
                This will generate a PDF invoice that you can save or print for your records.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsInvoiceModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDownload}
              className="flex-1"
            >
              Download PDF
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}