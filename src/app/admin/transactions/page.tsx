'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { api } from '~/utils/trpc';
import { formatCurrency, formatDate } from '~/lib/utils';
import { jsPDF } from 'jspdf';

export default function AdminTransactionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [page, setPage] = useState(1);
  const limit = 20;

  // Redirect if not admin (client-side to avoid SSR navigation)
  useEffect(() => {
    if (session && session.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [session, router]);

  if (!session || session.user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // Fetch all payments (admin only)
  const { data: paymentsData, isLoading } = api.payment.getAll.useQuery({
    page,
    limit,
    status: filterStatus === 'all' ? undefined : filterStatus,
  });

  const payments = paymentsData?.payments || [];
  const totalPages = paymentsData?.pages || 1;

  // Filter payments based on search and filters
  const filteredPayments = payments.filter((payment: any) => {
    const methodMatch = filterMethod === 'all' || payment.method.toLowerCase() === filterMethod;
    const searchMatch = searchQuery === '' || 
      payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.booking?.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let dateMatch = true;
    if (dateRange.from && dateRange.to) {
      const paymentDate = new Date(payment.createdAt);
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      dateMatch = paymentDate >= fromDate && paymentDate <= toDate;
    }
    
    return methodMatch && searchMatch && dateMatch;
  });

  // Calculate statistics
  const totalRevenue = payments
    .filter((p: any) => p.status === 'COMPLETED')
    .reduce((sum: number, p: any) => sum + p.amount, 0);
  
  const totalTransactions = payments.length;
  const completedTransactions = payments.filter((p: any) => p.status === 'COMPLETED').length;
  const pendingTransactions = payments.filter((p: any) => p.status === 'PENDING').length;
  const failedTransactions = payments.filter((p: any) => p.status === 'FAILED').length;

  // Export to CSV
  const exportToCSV = () => {
    const csvData = filteredPayments.map((payment: any) => ({
      'Transaction ID': payment.transactionId || payment.id,
      'Booking ID': payment.bookingId,
      'User Email': payment.booking?.user?.email || 'N/A',
      'Hotel': payment.booking?.hotel?.name || 'N/A',
      'Amount': payment.amount,
      'Method': payment.method,
      'Status': payment.status,
      'Date': formatDate(payment.createdAt),
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke object URL after download to free memory
    setTimeout(() => window.URL.revokeObjectURL(url), 0);
  };

  // Generate revenue report PDF
  const generateRevenueReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(55, 119, 255);
    doc.text('REVENUE REPORT', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 45, { align: 'center' });
    
    // Statistics
    doc.setFontSize(14);
    doc.text('Summary Statistics', 20, 65);
    
    doc.setFontSize(10);
    doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, 20, 80);
    doc.text(`Total Transactions: ${totalTransactions}`, 20, 90);
    doc.text(`Completed: ${completedTransactions}`, 20, 100);
    doc.text(`Pending: ${pendingTransactions}`, 20, 110);
    doc.text(`Failed: ${failedTransactions}`, 20, 120);
    doc.text(`Success Rate: ${totalTransactions > 0 ? Math.round((completedTransactions / totalTransactions) * 100) : 0}%`, 20, 130);
    
    // Payment Methods Breakdown
    const bkashCount = payments.filter((p: any) => p.method === 'BKASH' && p.status === 'COMPLETED').length;
    const nagadCount = payments.filter((p: any) => p.method === 'NAGAD' && p.status === 'COMPLETED').length;
    const bankCount = payments.filter((p: any) => p.method === 'BANK' && p.status === 'COMPLETED').length;
    
    doc.setFontSize(14);
    doc.text('Payment Methods', 20, 150);
    
    doc.setFontSize(10);
    doc.text(`bKash: ${bkashCount} transactions`, 20, 165);
    doc.text(`Nagad: ${nagadCount} transactions`, 20, 175);
    doc.text(`Bank Transfer: ${bankCount} transactions`, 20, 185);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('Hotel Booking System - Admin Dashboard', pageWidth / 2, 280, { align: 'center' });
    
    doc.save(`revenue-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'danger';
      default:
        return 'default';
    }
  };

  if (isLoading) {
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
              <h1 className="text-4xl font-bold text-gray-900">Transaction Management</h1>
              <p className="mt-2 text-gray-600">
                Admin dashboard for all transactions and revenue
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={exportToCSV}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </Button>
              <Button onClick={generateRevenueReport}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Revenue Report
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                From {completedTransactions} completed payments
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
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {pendingTransactions}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Awaiting completion
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
                {totalTransactions > 0 ? Math.round((completedTransactions / totalTransactions) * 100) : 0}%
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {completedTransactions} of {totalTransactions} successful
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Transaction ID, Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Methods</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterMethod('all');
                    setSearchQuery('');
                    setDateRange({ from: '', to: '' });
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Date Range */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              All Transactions ({filteredPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hotel
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-mono">
                        {payment.transactionId?.substring(0, 12) || payment.id.substring(0, 12)}...
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {payment.booking?.user?.email || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {payment.booking?.hotel?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {payment.method}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(payment.status)}>
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPayments.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-gray-500">No transactions found</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
