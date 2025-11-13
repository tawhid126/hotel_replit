'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { api } from '~/utils/trpc';
import { formatCurrency, formatDate } from '~/lib/utils';
import { jsPDF } from 'jspdf';

export default function OwnerTransactionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Redirect if not hotel owner
  if (session?.user?.role !== 'HOTEL_OWNER') {
    router.push('/');
    return null;
  }

  // Fetch owner's hotel
  const { data: hotel, isLoading: hotelLoading } = api.hotel.getMyHotel.useQuery();

  // Fetch payments for owner's hotel
  const { data: paymentsData, isLoading: paymentsLoading } = api.payment.getAll.useQuery({
    page: 1,
    limit: 1000,
  });

  const isLoading = hotelLoading || paymentsLoading;

  // Filter payments for owner's hotel only
  const allPayments = paymentsData?.payments || [];
  const hotelPayments = allPayments.filter((payment: any) => 
    payment.booking?.hotel?.id === hotel?.id
  );

  // Apply filters
  const filteredPayments = hotelPayments.filter((payment: any) => {
    const statusMatch = filterStatus === 'all' || payment.status === filterStatus;
    const methodMatch = filterMethod === 'all' || payment.method.toLowerCase() === filterMethod;
    
    let dateMatch = true;
    if (dateRange.from && dateRange.to) {
      const paymentDate = new Date(payment.createdAt);
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      dateMatch = paymentDate >= fromDate && paymentDate <= toDate;
    }
    
    return statusMatch && methodMatch && dateMatch;
  });

  // Calculate statistics
  const totalRevenue = hotelPayments
    .filter((p: any) => p.status === 'COMPLETED')
    .reduce((sum: number, p: any) => sum + p.amount, 0);
  
  const totalBookings = hotelPayments.length;
  const completedPayments = hotelPayments.filter((p: any) => p.status === 'COMPLETED').length;
  const pendingPayments = hotelPayments.filter((p: any) => p.status === 'PENDING').length;

  // Platform commission (assuming 10%)
  const platformCommission = totalRevenue * 0.10;
  const netRevenue = totalRevenue - platformCommission;

  // Export to CSV
  const exportToCSV = () => {
    const csvData = filteredPayments.map((payment: any) => ({
      'Booking ID': payment.bookingId,
      'Guest Email': payment.booking?.user?.email || 'N/A',
      'Room': payment.booking?.roomCategory?.name || 'N/A',
      'Check-in': payment.booking?.checkIn ? formatDate(payment.booking.checkIn) : 'N/A',
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
    a.download = `${hotel?.name}-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Generate payout report
  const generatePayoutReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(55, 119, 255);
    doc.text('PAYOUT REPORT', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Hotel: ${hotel?.name || 'N/A'}`, pageWidth / 2, 45, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 55, { align: 'center' });
    
    // Revenue Summary
    doc.setFontSize(14);
    doc.text('Revenue Summary', 20, 75);
    
    doc.setFontSize(10);
    doc.text(`Gross Revenue: ${formatCurrency(totalRevenue)}`, 20, 90);
    doc.text(`Platform Commission (10%): ${formatCurrency(platformCommission)}`, 20, 100);
    doc.text(`Net Payout: ${formatCurrency(netRevenue)}`, 20, 110);
    
    // Booking Stats
    doc.setFontSize(14);
    doc.text('Booking Statistics', 20, 130);
    
    doc.setFontSize(10);
    doc.text(`Total Bookings: ${totalBookings}`, 20, 145);
    doc.text(`Completed Payments: ${completedPayments}`, 20, 155);
    doc.text(`Pending Payments: ${pendingPayments}`, 20, 165);
    doc.text(`Success Rate: ${totalBookings > 0 ? Math.round((completedPayments / totalBookings) * 100) : 0}%`, 20, 175);
    
    // Payment Methods
    const bkashAmount = hotelPayments
      .filter((p: any) => p.method === 'BKASH' && p.status === 'COMPLETED')
      .reduce((sum: number, p: any) => sum + p.amount, 0);
    const nagadAmount = hotelPayments
      .filter((p: any) => p.method === 'NAGAD' && p.status === 'COMPLETED')
      .reduce((sum: number, p: any) => sum + p.amount, 0);
    const bankAmount = hotelPayments
      .filter((p: any) => p.method === 'BANK' && p.status === 'COMPLETED')
      .reduce((sum: number, p: any) => sum + p.amount, 0);
    
    doc.setFontSize(14);
    doc.text('Payment Methods Breakdown', 20, 195);
    
    doc.setFontSize(10);
    doc.text(`bKash: ${formatCurrency(bkashAmount)}`, 20, 210);
    doc.text(`Nagad: ${formatCurrency(nagadAmount)}`, 20, 220);
    doc.text(`Bank Transfer: ${formatCurrency(bankAmount)}`, 20, 230);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('This report is for informational purposes only', pageWidth / 2, 270, { align: 'center' });
    doc.text('For support, contact admin@hotelbooking.com', pageWidth / 2, 280, { align: 'center' });
    
    doc.save(`payout-report-${hotel?.name}-${new Date().toISOString().split('T')[0]}.pdf`);
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

  if (!hotel) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-4 text-lg font-semibold">No Hotel Found</h3>
              <p className="mt-2 text-gray-600">
                Please create a hotel first to view transactions
              </p>
              <Button className="mt-6" onClick={() => router.push('/owner/hotels/new')}>
                Create Hotel
              </Button>
            </CardContent>
          </Card>
        </div>
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
                Revenue and bookings for {hotel.name}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={exportToCSV}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </Button>
              <Button onClick={generatePayoutReport}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Payout Report
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Gross Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                From {completedPayments} completed bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Net Payout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(netRevenue)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                After 10% platform fee
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {totalBookings}
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
                {pendingPayments}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Awaiting completion
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Booking Transactions ({filteredPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPayments.length === 0 ? (
              <div className="py-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-lg text-gray-600">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-gray-500">Booking ID</p>
                        <p className="font-mono text-sm">{payment.bookingId.substring(0, 16)}...</p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Guest</p>
                        <p className="font-semibold">{payment.booking?.user?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Room</p>
                        <p className="font-semibold">{payment.booking?.roomCategory?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Amount</p>
                        <p className="font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Date</p>
                        <p className="font-semibold">{formatDate(payment.createdAt)}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Payment Method:</span>
                        <span className="font-semibold">{payment.method}</span>
                      </div>
                      {payment.transactionId && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">TXN:</span>
                          <span className="font-mono text-xs">{payment.transactionId.substring(0, 12)}...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
