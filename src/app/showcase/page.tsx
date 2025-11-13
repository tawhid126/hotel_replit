"use client";

/**
 * UI Components Showcase
 * This page demonstrates all the UI components
 * Access: /showcase (for development/testing only)
 */

import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { toast, toastMessages } from "~/components/ui/Toast";
import { BookingConfirmationModal } from "~/components/modals/BookingConfirmationModal";
import { ReviewModal } from "~/components/modals/ReviewModal";
import { LoginModal } from "~/components/modals/LoginModal";
import {
  HotelCardSkeleton,
  HotelListSkeleton,
  HotelDetailsSkeleton,
  RoomCardSkeleton,
  RoomListSkeleton,
  BookingListSkeleton,
  ReviewListSkeleton,
  TableSkeleton,
  DashboardSkeleton,
  SearchResultsSkeleton,
  ProfileSkeleton,
} from "~/components/ui/Skeleton";

export default function ComponentShowcase() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "modals" | "toasts" | "skeletons"
  >("modals");

  const demoBooking = {
    hotelName: "Grand Plaza Hotel",
    roomCategory: "Deluxe Suite",
    checkIn: "2025-10-20",
    checkOut: "2025-10-25",
    guests: 2,
    totalPrice: 25000,
    bookingId: "BK-2025-12345",
  };

  const handleReviewSubmit = async (review: {
    rating: number;
    comment: string;
    cleanliness: number;
    service: number;
    location: number;
    value: number;
  }) => {
    console.log("Review submitted:", review);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toastMessages.reviewSubmitted();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🧭 UI Components Showcase
          </h1>
          <p className="text-gray-600">
            Test all implemented UI components in one place
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <div className="flex space-x-6 px-6">
              <button
                onClick={() => setActiveTab("modals")}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  activeTab === "modals"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Modals
              </button>
              <button
                onClick={() => setActiveTab("toasts")}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  activeTab === "toasts"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Toast Notifications
              </button>
              <button
                onClick={() => setActiveTab("skeletons")}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  activeTab === "skeletons"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Skeleton Loaders
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Modals Tab */}
            {activeTab === "modals" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Modal Components</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-6 space-y-3">
                      <h3 className="font-semibold">Booking Confirmation</h3>
                      <p className="text-sm text-gray-600">
                        Shows booking details after successful booking
                      </p>
                      <Button onClick={() => setShowBookingModal(true)}>
                        Open Booking Modal
                      </Button>
                    </div>

                    <div className="border rounded-lg p-6 space-y-3">
                      <h3 className="font-semibold">Review Submission</h3>
                      <p className="text-sm text-gray-600">
                        Allows users to submit reviews with ratings
                      </p>
                      <Button onClick={() => setShowReviewModal(true)}>
                        Open Review Modal
                      </Button>
                    </div>

                    <div className="border rounded-lg p-6 space-y-3">
                      <h3 className="font-semibold">Login Modal</h3>
                      <p className="text-sm text-gray-600">
                        Quick login without page navigation
                      </p>
                      <Button onClick={() => setShowLoginModal(true)}>
                        Open Login Modal
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Toasts Tab */}
            {activeTab === "toasts" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">
                    Toast Notifications
                  </h2>

                  <div className="space-y-6">
                    {/* Basic Toasts */}
                    <div>
                      <h3 className="font-semibold mb-3">Basic Toasts</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button onClick={() => toast.success("Success message!")}>
                          Success
                        </Button>
                        <Button
                          onClick={() => toast.error("Error message!")}
                          variant="danger"
                        >
                          Error
                        </Button>
                        <Button
                          onClick={() => toast.loading("Loading...")}
                          variant="secondary"
                        >
                          Loading
                        </Button>
                        <Button
                          onClick={() => toast.custom("Custom message", "🎉")}
                          variant="outline"
                        >
                          Custom
                        </Button>
                      </div>
                    </div>

                    {/* Pre-defined Messages */}
                    <div>
                      <h3 className="font-semibold mb-3">
                        Pre-defined Messages
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button onClick={() => toastMessages.loginSuccess()}>
                          Login Success
                        </Button>
                        <Button onClick={() => toastMessages.bookingSuccess()}>
                          Booking Success
                        </Button>
                        <Button onClick={() => toastMessages.paymentSuccess()}>
                          Payment Success
                        </Button>
                        <Button onClick={() => toastMessages.reviewSubmitted()}>
                          Review Submitted
                        </Button>
                        <Button onClick={() => toastMessages.hotelCreated()}>
                          Hotel Created
                        </Button>
                        <Button onClick={() => toastMessages.roomUpdated()}>
                          Room Updated
                        </Button>
                        <Button
                          onClick={() => toastMessages.imageUploadSuccess()}
                        >
                          Image Uploaded
                        </Button>
                        <Button onClick={() => toastMessages.networkError()}>
                          Network Error
                        </Button>
                      </div>
                    </div>

                    {/* Promise Toast */}
                    <div>
                      <h3 className="font-semibold mb-3">Promise Toast</h3>
                      <Button
                        onClick={() => {
                          toast.promise(
                            new Promise((resolve) =>
                              setTimeout(resolve, 2000)
                            ),
                            {
                              loading: "Processing...",
                              success: "Completed successfully!",
                              error: "Failed to complete",
                            }
                          );
                        }}
                      >
                        Test Promise Toast (2s)
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Skeletons Tab */}
            {activeTab === "skeletons" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">
                    Skeleton Loaders
                  </h2>

                  <div className="space-y-8">
                    {/* Hotel Card Skeleton */}
                    <div>
                      <h3 className="font-semibold mb-3">Hotel Card Skeleton</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <HotelCardSkeleton />
                        <HotelCardSkeleton />
                        <HotelCardSkeleton />
                      </div>
                    </div>

                    {/* Room Card Skeleton */}
                    <div>
                      <h3 className="font-semibold mb-3">Room Card Skeleton</h3>
                      <RoomCardSkeleton />
                    </div>

                    {/* Booking List Skeleton */}
                    <div>
                      <h3 className="font-semibold mb-3">
                        Booking List Skeleton
                      </h3>
                      <BookingListSkeleton count={2} />
                    </div>

                    {/* Review List Skeleton */}
                    <div>
                      <h3 className="font-semibold mb-3">
                        Review List Skeleton
                      </h3>
                      <ReviewListSkeleton count={2} />
                    </div>

                    {/* Table Skeleton */}
                    <div>
                      <h3 className="font-semibold mb-3">Table Skeleton</h3>
                      <TableSkeleton rows={3} cols={4} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Code Examples */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Code Examples</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Toast Usage</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { toast, toastMessages } from "~/components/ui/Toast";

// Simple toast
toast.success("Success!");
toast.error("Error!");

// Pre-defined message
toastMessages.bookingSuccess();

// Promise toast
toast.promise(
  fetchData(),
  {
    loading: "Loading...",
    success: "Success!",
    error: "Failed!",
  }
);`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Modal Usage</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { BookingConfirmationModal } from "~/components/modals/BookingConfirmationModal";

<BookingConfirmationModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  booking={{
    hotelName: "Grand Plaza",
    bookingId: "BK-001",
    // ... other fields
  }}
/>`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Skeleton Usage</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { HotelListSkeleton } from "~/components/ui/Skeleton";

function HotelsPage() {
  const { data, isLoading } = useQuery();
  
  if (isLoading) return <HotelListSkeleton count={9} />;
  
  return <div>{/* Render hotels */}</div>;
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BookingConfirmationModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        booking={demoBooking}
        onViewBooking={() => {
          setShowBookingModal(false);
          toastMessages.success("Navigating to booking details...");
        }}
      />

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        hotelName="Grand Plaza Hotel"
        bookingId="BK-2025-12345"
        onSubmit={handleReviewSubmit}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        redirectTo="/profile"
      />
    </div>
  );
}
