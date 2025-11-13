"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "~/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/Tabs";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { formatCurrency, formatDate } from "~/lib/utils";
import toast from "react-hot-toast";
import { useState } from "react";
import { Modal } from "~/components/ui/Modal";
import { SmsPreferences } from "~/components/profile/SmsPreferences";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const { data: userProfile } = api.user.getProfile.useQuery(undefined, {
    enabled: !!session?.user?.id,
  });

  const { data: bookings, refetch } = api.booking.getMyBookings.useQuery(undefined, {
    enabled: !!session?.user?.id,
  });

  // const { data: reviews } = api.review.getByUserId.useQuery(
  //   { userId: session?.user?.id || "" },
  //   { enabled: !!session?.user?.id }
  // );
  const reviews: any[] = []; // TODO: Add getByUserId endpoint to review router

  const cancelBooking = api.booking.cancel.useMutation({
    onSuccess: () => {
      toast.success("Booking cancelled successfully");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel booking");
    },
  });

  // Download invoice as PDF
  const downloadInvoice = (booking: any) => {
    setSelectedBooking(booking);
    setShowInvoiceModal(true);
  };

  const generatePDF = () => {
    if (!selectedBooking) return;
    
    // Create invoice content
    const invoiceContent = `
      INVOICE
      ========
      
      Invoice #: INV-${selectedBooking.id.slice(0, 8).toUpperCase()}
      Date: ${formatDate(new Date())}
      
      BOOKING DETAILS
      ================
      Hotel: ${selectedBooking.hotel.name}
      Room: ${selectedBooking.roomCategory.name}
      Check-in: ${formatDate(selectedBooking.checkIn)}
      Check-out: ${formatDate(selectedBooking.checkOut)}
      Guests: ${selectedBooking.guestCount}
      
      CUSTOMER DETAILS
      ================
      Name: ${session?.user?.name}
      Email: ${session?.user?.email}
      
      PAYMENT SUMMARY
      ===============
      Room Charges: ${formatCurrency(selectedBooking.totalPrice)}
      Total Amount: ${formatCurrency(selectedBooking.totalPrice)}
      
      Payment Method: ${selectedBooking.payment?.method || 'Pending'}
      Payment Status: ${selectedBooking.payment?.status || 'Pending'}
      
      Thank you for choosing ${selectedBooking.hotel.name}!
    `;
    
    // Create blob and download
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${selectedBooking.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success("Invoice downloaded successfully!");
    setShowInvoiceModal(false);
  };

  // Rebook functionality
  const handleRebook = (booking: any) => {
    // Navigate to hotel page with pre-filled data
    const params = new URLSearchParams({
      checkIn: booking.checkIn.toISOString().split('T')[0],
      checkOut: booking.checkOut.toISOString().split('T')[0],
      guests: booking.guestCount.toString(),
      room: booking.roomCategory.id,
    });
    router.push(`/hotels/${booking.hotelId}?${params.toString()}`);
    toast.success("Redirecting to rebook...");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to signin on client once session is confirmed missing
  if (!session) {
    if (status === "unauthenticated") {
      // Avoid calling router.push during render on the server
      if (typeof window !== "undefined") {
        router.push("/auth/signin");
      }
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to sign in…</p>
        </div>
      </div>
    );
  }

  const activeBookings = bookings?.filter(
    (b) => b.status === "CONFIRMED" || b.status === "PENDING"
  );
  const completedBookings = bookings?.filter((b) => b.status === "COMPLETED");
  const cancelledBookings = bookings?.filter((b) => b.status === "CANCELLED");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge variant="success">Confirmed</Badge>;
      case "PENDING":
        return <Badge variant="warning">Pending</Badge>;
      case "COMPLETED":
        return <Badge variant="info">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {session.user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <div className="ml-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {session.user?.name}
                  </h1>
                  <p className="text-gray-600">{session.user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {session.user?.role && (
                      <Badge variant="info">
                        {session.user.role}
                      </Badge>
                    )}
                    <Badge variant="success">
                      {bookings?.length || 0} Total Bookings
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {activeBookings?.length || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Active Bookings</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {completedBookings?.length || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {reviews?.length || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Reviews</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">
                  {cancelledBookings?.length || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Cancelled</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bookings">
              Bookings ({bookings?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({reviews?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Tabs defaultValue="active" className="space-y-4">
              <TabsList>
                <TabsTrigger value="active">
                  Active ({activeBookings?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedBookings?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="cancelled">
                  Cancelled ({cancelledBookings?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                <div className="space-y-4">
                  {activeBookings && activeBookings.length > 0 ? (
                    activeBookings.map((booking) => (
                      <Card key={booking.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {booking.hotel.name}
                                </h3>
                                {getStatusBadge(booking.status)}
                              </div>
                              <p className="text-gray-600">
                                {booking.roomCategory.name}
                              </p>
                              <div className="mt-3 space-y-1 text-sm text-gray-600">
                                <p>
                                  Check-in: {formatDate(booking.checkIn)}
                                </p>
                                <p>
                                  Check-out: {formatDate(booking.checkOut)}
                                </p>
                                <p>Guests: {booking.guestCount}</p>
                                <p className="font-semibold text-gray-900">
                                  Total: {formatCurrency(booking.totalPrice)}
                                </p>
                                {booking.payment && (
                                  <p className="text-sm">
                                    Payment Status:{" "}
                                    <Badge
                                      variant={
                                        booking.payment.status === "COMPLETED"
                                          ? "success"
                                          : booking.payment.status === "PENDING"
                                          ? "warning"
                                          : "danger"
                                      }
                                    >
                                      {booking.payment.status}
                                    </Badge>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="ml-4 space-y-2 flex flex-col">
                              {booking.status === "PENDING" && !booking.payment && (
                                <Button
                                  onClick={() =>
                                    router.push(`/bookings/${booking.id}`)
                                  }
                                  variant="primary"
                                >
                                  Complete Payment
                                </Button>
                              )}
                              <Button
                                onClick={() =>
                                  router.push(`/bookings/${booking.id}`)
                                }
                                variant="outline"
                              >
                                View Details
                              </Button>
                              {booking.payment?.status === "COMPLETED" && (
                                <Button
                                  onClick={() => downloadInvoice(booking)}
                                  variant="outline"
                                  className="flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Download Invoice
                                </Button>
                              )}
                              {booking.status === "CONFIRMED" && (
                                <Button
                                  onClick={() =>
                                    cancelBooking.mutate({ id: booking.id })
                                  }
                                  variant="danger"
                                  isLoading={cancelBooking.isPending}
                                  className="w-full"
                                >
                                  Cancel Booking
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center py-12">
                        <div className="flex flex-col items-center">
                          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="text-gray-500 text-lg font-medium">No active bookings</p>
                          <p className="text-gray-400 text-sm mt-1">Start planning your next stay!</p>
                          <Button
                            onClick={() => router.push("/")}
                            className="mt-6"
                          >
                            Browse Hotels
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="completed">
                <div className="space-y-4">
                  {completedBookings && completedBookings.length > 0 ? (
                    completedBookings.map((booking) => (
                      <Card key={booking.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {booking.hotel.name}
                                </h3>
                                {getStatusBadge(booking.status)}
                              </div>
                              <p className="text-gray-600">
                                {booking.roomCategory.name}
                              </p>
                              <div className="mt-3 space-y-1 text-sm text-gray-600">
                                <p>
                                  Check-in: {formatDate(booking.checkIn)}
                                </p>
                                <p>
                                  Check-out: {formatDate(booking.checkOut)}
                                </p>
                                <p>Guests: {booking.guestCount}</p>
                                <p className="font-semibold text-gray-900">
                                  Total: {formatCurrency(booking.totalPrice)}
                                </p>
                              </div>
                            </div>
                            <div className="ml-4 space-y-2 flex flex-col">
                              <Button
                                onClick={() =>
                                  router.push(`/bookings/${booking.id}`)
                                }
                                variant="outline"
                              >
                                View Details
                              </Button>
                              <Button
                                onClick={() => downloadInvoice(booking)}
                                variant="outline"
                                className="flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download Invoice
                              </Button>
                              <Button
                                onClick={() => handleRebook(booking)}
                                variant="primary"
                                className="flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Rebook
                              </Button>
                              <Button
                                onClick={() =>
                                  router.push(
                                    `/hotels/${booking.hotelId}/review`
                                  )
                                }
                                variant="outline"
                              >
                                Write Review
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center py-12">
                        <div className="flex flex-col items-center">
                          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-gray-500 text-lg font-medium">No completed bookings</p>
                          <p className="text-gray-400 text-sm mt-1">Your stay history will appear here</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="cancelled">
                <div className="space-y-4">
                  {cancelledBookings && cancelledBookings.length > 0 ? (
                    cancelledBookings.map((booking) => (
                      <Card key={booking.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {booking.hotel.name}
                                </h3>
                                {getStatusBadge(booking.status)}
                              </div>
                              <p className="text-gray-600">
                                {booking.roomCategory.name}
                              </p>
                              <div className="mt-3 space-y-1 text-sm text-gray-600">
                                <p>
                                  Check-in: {formatDate(booking.checkIn)}
                                </p>
                                <p>
                                  Check-out: {formatDate(booking.checkOut)}
                                </p>
                                <p>Guests: {booking.guestCount}</p>
                                <p className="font-semibold text-gray-900">
                                  Total: {formatCurrency(booking.totalPrice)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center py-12">
                        <p className="text-gray-500">No cancelled bookings</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <div className="space-y-4">
              {reviews && reviews.length > 0 ? (
                reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {review.hotel.name}
                          </h3>
                          <div className="flex items-center mt-2">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-5 h-5 ${
                                  i < review.rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                              </svg>
                            ))}
                            <span className="ml-2 text-sm text-gray-600">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          <p className="mt-3 text-gray-700">{review.comment}</p>
                          {review.approved ? (
                            <Badge variant="success" className="mt-2">
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="mt-2">
                              Pending Approval
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <p className="text-gray-500">No reviews yet</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Complete a booking to leave a review
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              {/* SMS Preferences */}
              <SmsPreferences 
                initialPhone={userProfile?.phone}
                initialSmsEnabled={userProfile?.smsEnabled ?? true}
              />
              
              {/* Account Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={session.user?.name || ""}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={session.user?.email || ""}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                    <Button variant="outline" disabled>
                      Edit Profile (Coming Soon)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Invoice Modal */}
        <Modal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          title="Download Invoice"
        >
          {selectedBooking && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">INVOICE</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Invoice #: INV-{selectedBooking.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Date: {formatDate(new Date())}
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Booking Details</h4>
                  <div className="space-y-1 text-sm">
                    <p className="flex justify-between">
                      <span className="text-gray-600">Hotel:</span>
                      <span className="font-medium">{selectedBooking.hotel.name}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Room:</span>
                      <span className="font-medium">{selectedBooking.roomCategory.name}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Check-in:</span>
                      <span className="font-medium">{formatDate(selectedBooking.checkIn)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Check-out:</span>
                      <span className="font-medium">{formatDate(selectedBooking.checkOut)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Guests:</span>
                      <span className="font-medium">{selectedBooking.guestCount}</span>
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Customer Details</h4>
                  <div className="space-y-1 text-sm">
                    <p className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{session?.user?.name}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{session?.user?.email}</span>
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Payment Summary</h4>
                  <div className="space-y-1 text-sm">
                    <p className="flex justify-between">
                      <span className="text-gray-600">Room Charges:</span>
                      <span className="font-medium">{formatCurrency(selectedBooking.totalPrice)}</span>
                    </p>
                    <p className="flex justify-between text-lg font-bold text-gray-900 mt-2 pt-2 border-t border-gray-200">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(selectedBooking.totalPrice)}</span>
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="flex justify-between text-sm">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium">{selectedBooking.payment?.method || 'Pending'}</span>
                      </p>
                      <p className="flex justify-between text-sm mt-1">
                        <span className="text-gray-600">Payment Status:</span>
                        <Badge
                          variant={
                            selectedBooking.payment?.status === "COMPLETED"
                              ? "success"
                              : "warning"
                          }
                        >
                          {selectedBooking.payment?.status || 'Pending'}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center text-sm text-gray-500">
                  <p>Thank you for choosing {selectedBooking.hotel.name}!</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowInvoiceModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={generatePDF}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download as PDF
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
