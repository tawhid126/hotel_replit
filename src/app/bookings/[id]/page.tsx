"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "~/utils/trpc";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import { Input } from "~/components/ui/Input";
import { formatCurrency, formatDate, calculateNights } from "~/lib/utils";
import toast from "react-hot-toast";

type PaymentMethod = "BKASH" | "NAGAD" | "BANK";

export default function BookingConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const bookingId = params.id as string;

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    phoneNumber: "",
    transactionId: "",
    accountNumber: "",
    bankName: "",
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    valid: boolean;
    discount: number;
    finalAmount: number;
    message?: string;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/bookings/${bookingId}`);
    }
  }, [status, router, bookingId]);

  // Fetch booking details
  const { data: booking, isLoading, refetch } = api.booking.getById.useQuery(
    { id: bookingId },
    { enabled: !!bookingId && status === "authenticated" }
  );

  // Validate coupon
  const validateCoupon = api.coupon.validate.useQuery(
    {
      code: couponCode,
      amount: booking?.totalPrice || 0,
    },
    { enabled: false }
  );

  // Apply coupon handler
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    if (!booking) {
      toast.error("Booking not found");
      return;
    }

    setIsValidatingCoupon(true);

    try {
      const result = await validateCoupon.refetch();
      
      if (result.data?.valid && 'discount' in result.data && result.data.discount !== undefined) {
        setAppliedCoupon(result.data as {
          valid: boolean;
          discount: number;
          finalAmount: number;
          message?: string;
        });
        toast.success(
          `🎉 Coupon applied! You saved ${formatCurrency(result.data.discount)}`
        );
      } else {
        setAppliedCoupon(null);
        const errorMessage = result.data && 'message' in result.data ? result.data.message : "Invalid coupon code";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Coupon validation error:", error);
      toast.error("Failed to validate coupon");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Remove coupon handler
  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    toast.success("Coupon removed");
  };

  // Create payment mutation
  const createPaymentMutation = api.payment.create.useMutation({
    onSuccess: async (payment) => {
      await refetch();
      setIsProcessingPayment(false);
      // Redirect to success page
      router.push(`/payment/success?paymentId=${payment.id}`);
    },
    onError: (error) => {
      console.error("Payment failed:", error);
      setIsProcessingPayment(false);
      alert("Payment failed. Please try again.");
    },
  });

  // Cancel booking mutation
  const cancelBookingMutation = api.booking.cancel.useMutation({
    onSuccess: async () => {
      await refetch();
      alert("Booking cancelled successfully. Room availability has been restored.");
      router.push("/profile");
    },
    onError: (error) => {
      console.error("Cancellation failed:", error);
      alert("Failed to cancel booking. Please try again.");
    },
  });

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      alert("Please select a payment method");
      return;
    }

    // Validate payment details based on method
    if (selectedPaymentMethod === "BKASH" || selectedPaymentMethod === "NAGAD") {
      if (!paymentDetails.phoneNumber || !paymentDetails.transactionId) {
        alert("Please enter phone number and transaction ID");
        return;
      }
    } else if (selectedPaymentMethod === "BANK") {
      if (!paymentDetails.accountNumber || !paymentDetails.bankName) {
        alert("Please enter account number and bank name");
        return;
      }
    }

    setIsProcessingPayment(true);

    try {
      await createPaymentMutation.mutateAsync({
        bookingId,
        method: selectedPaymentMethod,
        couponCode: appliedCoupon ? couponCode : undefined,
      });
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 mb-4">Booking not found</p>
            <Link href="/profile">
              <Button>View My Bookings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const nights = calculateNights(new Date(booking.checkIn), new Date(booking.checkOut));
  const hasPayment = booking.payment && booking.payment.status === "COMPLETED";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/profile" className="text-blue-600 hover:underline mb-2 inline-block">
            ← Back to My Bookings
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">
            {hasPayment ? "Booking Confirmed" : "Complete Your Booking"}
          </h1>
          <p className="text-gray-600 mt-2">Booking ID: {booking.id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Banner */}
            <Card className={`border-2 ${
              hasPayment 
                ? "border-green-500 bg-green-50" 
                : booking.status === "CANCELLED"
                ? "border-red-500 bg-red-50"
                : "border-yellow-500 bg-yellow-50"
            }`}>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {hasPayment ? "✓ Payment Successful" : "⏳ Payment Pending"}
                    </h2>
                    <p className="text-gray-700 mt-1">
                      {hasPayment
                        ? "Your booking is confirmed. Check your email for details."
                        : "Please complete the payment to confirm your booking."}
                    </p>
                  </div>
                  <Badge
                    variant={
                      hasPayment
                        ? "success"
                        : booking.status === "CANCELLED"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {booking.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Hotel Details */}
            <Card>
              <CardHeader>
                <CardTitle>Hotel Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white text-4xl flex-shrink-0">
                    {booking.hotel.images?.[0] ? (
                      <img
                        src={booking.hotel.images[0]}
                        alt={booking.hotel.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      "🏨"
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {booking.hotel.name}
                    </h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      {booking.hotel.city}, {booking.hotel.country}
                    </div>
                    <p className="text-gray-600">
                      {booking.hotel.address}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Room Details */}
            <Card>
              <CardHeader>
                <CardTitle>Room Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {booking.roomCategory.name}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {booking.roomCategory.description}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-500">Check-in</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(booking.checkIn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Check-out</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(booking.checkOut)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Guests</p>
                      <p className="font-semibold text-gray-900">
                        {booking.guestCount} {booking.guestCount === 1 ? "Guest" : "Guests"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nights</p>
                      <p className="font-semibold text-gray-900">
                        {nights} {nights === 1 ? "Night" : "Nights"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guest Information */}
            <Card>
              <CardHeader>
                <CardTitle>Guest Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-semibold text-gray-900">{session?.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-900">{session?.user?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            {hasPayment && booking.payment && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method</span>
                      <span className="font-semibold">{booking.payment.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(booking.payment.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Date</span>
                      <span className="font-semibold">
                        {formatDate(booking.payment.createdAt)}
                      </span>
                    </div>
                    {booking.payment.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction ID</span>
                        <span className="font-semibold font-mono text-sm">
                          {booking.payment.transactionId}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Payment & Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Coupon/Promo Code Section */}
            {!hasPayment && booking.status !== "CANCELLED" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>🎟️</span>
                    <span>Have a Promo Code?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!appliedCoupon ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Enter your coupon code to get discount on your booking
                      </p>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Enter promo code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleApplyCoupon();
                            }
                          }}
                          className="flex-1"
                          disabled={isValidatingCoupon}
                        />
                        <Button
                          onClick={handleApplyCoupon}
                          disabled={isValidatingCoupon || !couponCode.trim()}
                          className="whitespace-nowrap"
                        >
                          {isValidatingCoupon ? (
                            <span className="flex items-center gap-2">
                              <span className="animate-spin">⏳</span>
                              Validating...
                            </span>
                          ) : (
                            "Apply"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 text-xl">✓</span>
                          <div>
                            <p className="font-semibold text-green-900">
                              Coupon Applied: {couponCode}
                            </p>
                            <p className="text-sm text-green-700">
                              You saved {formatCurrency(appliedCoupon.discount)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-gray-500 hover:text-red-600 transition-colors"
                          title="Remove coupon"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Price Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Price Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {formatCurrency(booking.totalPrice / nights)} × {nights}{" "}
                      {nights === 1 ? "night" : "nights"}
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(booking.totalPrice)}
                    </span>
                  </div>
                  
                  {/* Show discount if coupon is applied */}
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center gap-2">
                        <span>🎟️</span>
                        <span>Discount ({couponCode})</span>
                      </span>
                      <span className="font-semibold">
                        -{formatCurrency(appliedCoupon.discount)}
                      </span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-blue-600">
                        {appliedCoupon 
                          ? formatCurrency(booking.totalPrice - appliedCoupon.discount)
                          : formatCurrency(booking.totalPrice)
                        }
                      </span>
                    </div>
                    {appliedCoupon && (
                      <p className="text-sm text-gray-500 mt-1">
                        Original: <span className="line-through">{formatCurrency(booking.totalPrice)}</span>
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Section */}
            {!hasPayment && booking.status !== "CANCELLED" && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Payment Method Selection */}
                  <div className="space-y-2">
                    {[
                      {
                        method: "BKASH" as PaymentMethod,
                        name: "bKash",
                        icon: "📱",
                        popular: true,
                      },
                      {
                        method: "NAGAD" as PaymentMethod,
                        name: "Nagad",
                        icon: "💳",
                        popular: true,
                      },
                      {
                        method: "BANK" as PaymentMethod,
                        name: "Bank Transfer",
                        icon: "🏦",
                        popular: false,
                      },
                    ].map((option) => (
                      <button
                        key={option.method}
                        onClick={() => setSelectedPaymentMethod(option.method)}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          selectedPaymentMethod === option.method
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{option.icon}</span>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {option.name}
                              </div>
                              {option.popular && (
                                <span className="text-xs text-gray-500">
                                  Most popular
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedPaymentMethod === option.method && (
                            <svg
                              className="w-6 h-6 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Payment Details Form */}
                  {selectedPaymentMethod && (
                    <div className="pt-4 border-t space-y-3">
                      {(selectedPaymentMethod === "BKASH" ||
                        selectedPaymentMethod === "NAGAD") && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              placeholder="01XXXXXXXXX"
                              value={paymentDetails.phoneNumber}
                              onChange={(e) =>
                                setPaymentDetails({
                                  ...paymentDetails,
                                  phoneNumber: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Transaction ID
                            </label>
                            <input
                              type="text"
                              placeholder="TXN123456789"
                              value={paymentDetails.transactionId}
                              onChange={(e) =>
                                setPaymentDetails({
                                  ...paymentDetails,
                                  transactionId: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </>
                      )}

                      {selectedPaymentMethod === "BANK" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Bank Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., Dutch Bangla Bank"
                              value={paymentDetails.bankName}
                              onChange={(e) =>
                                setPaymentDetails({
                                  ...paymentDetails,
                                  bankName: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Account Number
                            </label>
                            <input
                              type="text"
                              placeholder="Account number"
                              value={paymentDetails.accountNumber}
                              onChange={(e) =>
                                setPaymentDetails({
                                  ...paymentDetails,
                                  accountNumber: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Payment Button */}
                  <Button
                    onClick={handlePayment}
                    disabled={!selectedPaymentMethod || isProcessingPayment}
                    isLoading={isProcessingPayment}
                    className="w-full mt-4"
                    size="lg"
                  >
                    {isProcessingPayment
                      ? "Processing..."
                      : `Pay ${formatCurrency(
                          appliedCoupon 
                            ? booking.totalPrice - appliedCoupon.discount 
                            : booking.totalPrice
                        )}`}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    By completing this booking, you agree to our terms and
                    conditions
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Actions for Confirmed Booking */}
            {hasPayment && (
              <Card>
                <CardContent className="py-6 space-y-3">
                  <Button className="w-full" size="lg">
                    Download Invoice
                  </Button>
                  <Button
                    onClick={() => router.push("/profile")}
                    variant="outline"
                    className="w-full"
                  >
                    Contact Hotel
                  </Button>
                  {booking.status === "CONFIRMED" && (
                    <Button
                      onClick={() => {
                        if (confirm("Are you sure you want to cancel this booking? Room availability will be restored.")) {
                          cancelBookingMutation.mutate({ id: booking.id });
                        }
                      }}
                      isLoading={cancelBookingMutation.isPending}
                      variant="danger"
                      className="w-full"
                    >
                      Cancel Booking
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
