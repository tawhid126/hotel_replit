"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "~/utils/trpc";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import { Modal } from "~/components/ui/Modal";
import { formatCurrency, formatDate } from "~/lib/utils";
import toast from "react-hot-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/Tabs";
import { ReviewForm } from "~/components/reviews/ReviewForm";
import { ReviewList } from "~/components/reviews/ReviewList";
import { RatingSummary } from "~/components/reviews/RatingSummary";
import { useOfflineHotels } from "~/hooks/useOfflineHotels";
import { useRealtimeAvailability } from "~/hooks/useRealtimeAvailability";

export default function HotelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const hotelId = params.id as string;

  const [selectedRoomCategory, setSelectedRoomCategory] = useState<string>("");
  const [selectedGuestCount, setSelectedGuestCount] = useState(1);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: hotel, isLoading } = api.hotel.getById.useQuery({ id: hotelId });
  
  // Real-time availability updates for this hotel
  const { getAvailability, isAvailable, lastUpdate } = useRealtimeAvailability({
    hotelId,
    enabled: true,
  });
  
  // Save hotel to IndexedDB for offline viewing
  useOfflineHotels(hotel ? {
    id: hotel.id,
    name: hotel.name,
    description: hotel.description || '',
    address: hotel.address,
    city: hotel.city,
    country: hotel.country,
    pricePerNight: hotel.roomCategories?.[0]?.prices?.[0]?.price || 0,
    rating: hotel.rating,
    imageUrl: hotel.images?.[0] || null,
    timestamp: Date.now(),
  } : null);
  
  // Fetch reviews separately with pagination
  const [reviewPage, setReviewPage] = useState(1);
  const { data: reviewsData, refetch: refetchReviews } = api.review.getByHotel.useQuery({
    hotelId,
    page: reviewPage,
    limit: 10,
  });

  const createBooking = api.booking.create.useMutation({
    onSuccess: (booking: any) => {
      toast.success("Booking created successfully! Redirecting to payment...");
      // Redirect to booking confirmation page where user can complete payment
      router.push(`/bookings/${booking.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create booking");
    },
  });

  const handleBooking = async () => {
    if (!session) {
      toast.error("Please sign in to book");
      router.push(`/signin?callbackUrl=/hotels/${hotelId}`);
      return;
    }

    if (!selectedRoomCategory || !checkIn || !checkOut) {
      toast.error("Please select room category and dates");
      return;
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      toast.error("Check-in date cannot be in the past");
      return;
    }

    if (checkOutDate <= checkInDate) {
      toast.error("Check-out date must be after check-in date");
      return;
    }

    // Create booking with calculated total price (backend will recalculate for security)
    createBooking.mutate({
      hotelId: hotelId,
      roomCategoryId: selectedRoomCategory,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guestCount: selectedGuestCount,
    });
  };

  const getRoomPrice = (category: any) => {
    if (!category?.prices || category.prices.length === 0) {
      return category?.basePrice || 0;
    }
    
    const priceForGuests = category.prices.find(
      (p: any) => p.guestCount === selectedGuestCount
    );
    
    if (priceForGuests) {
      return priceForGuests.price;
    }
    
    const sortedPrices = [...category.prices].sort((a: any, b: any) => b.guestCount - a.guestCount);
    const nearestPrice = sortedPrices.find((p: any) => p.guestCount <= selectedGuestCount);
    
    return nearestPrice?.price || category.prices[0]?.price || category.basePrice || 0;
  };

  const selectedRoom = hotel?.roomCategories?.find(
    (r: any) => r.id === selectedRoomCategory
  );
  const selectedPrice = selectedRoom ? getRoomPrice(selectedRoom) : 0;

  const numberOfNights = checkIn && checkOut
    ? Math.ceil(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const totalPrice = selectedPrice * numberOfNights;

  // Calculate average rating
  const averageRating =
    hotel?.reviews && hotel.reviews.length > 0
      ? hotel.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) /
        hotel.reviews.length
      : hotel?.rating || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Hotel not found</h1>
          <Button onClick={() => router.push("/")} className="mt-4">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const hotelImages = hotel.images && hotel.images.length > 0 ? hotel.images : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link href="/" className="text-gray-500 hover:text-gray-700">
                  Home
                </Link>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <Link href="/hotels" className="text-gray-500 hover:text-gray-700">
                  Hotels
                </Link>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li className="text-gray-900 font-medium">{hotel.name}</li>
            </ol>
          </nav>
        </div>

        {/* Image Gallery with Carousel */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[500px]">
            {/* Main Image */}
            {hotelImages.length > 0 ? (
              <>
                <div
                  className="md:col-span-3 relative rounded-l-lg overflow-hidden cursor-pointer group"
                  onClick={() => {
                    setCurrentImageIndex(0);
                    setShowImageModal(true);
                  }}
                >
                  <img
                    src={hotelImages[0]}
                    alt={hotel.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Thumbnail Grid */}
                <div className="hidden md:flex md:flex-col gap-2">
                  {hotelImages.slice(1, 3).map((image: string, index: number) => (
                    <div
                      key={index}
                      className="relative h-1/2 overflow-hidden cursor-pointer group rounded-r-lg"
                      onClick={() => {
                        setCurrentImageIndex(index + 1);
                        setShowImageModal(true);
                      }}
                    >
                      <img
                        src={image}
                        alt={`${hotel.name} - ${index + 2}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ))}
                  
                  {/* Show all photos button */}
                  {hotelImages.length > 3 && (
                    <button
                      onClick={() => {
                        setCurrentImageIndex(0);
                        setShowImageModal(true);
                      }}
                      className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100 transition flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Show all {hotelImages.length} photos
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="md:col-span-4 h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <svg className="w-24 h-24 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                  </svg>
                  <p className="text-2xl font-semibold">🏨 {hotel.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hotel Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {hotel.name}
              </h1>
              <div className="flex items-center gap-4 text-gray-600 mb-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {hotel.address}, {hotel.city}, {hotel.country}
                </div>
              </div>
              
              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-blue-600 text-white px-3 py-1 rounded-lg">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-semibold">{averageRating.toFixed(1)}</span>
                </div>
                <span className="text-gray-600">
                  ({hotel.reviews?.length || 0} reviews)
                </span>
              </div>
            </div>

            {/* Share Button */}
            <Button variant="outline" size="sm">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">About This Hotel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{hotel.description}</p>
              </CardContent>
            </Card>

            {/* Services & Facilities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Services & Facilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hotel.facilities && hotel.facilities.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {hotel.facilities.map((facility: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-800">{facility}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No facilities information available</p>
                )}
              </CardContent>
            </Card>

            {/* Google Maps */}
            {hotel.latitude && hotel.longitude && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-gray-700 flex items-start">
                      <svg className="w-5 h-5 mr-2 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {hotel.address}, {hotel.city}, {hotel.country}
                    </p>
                    
                    <div className="aspect-video w-full rounded-lg overflow-hidden shadow-md">
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://www.google.com/maps?q=${hotel.latitude},${hotel.longitude}&output=embed`}
                        allowFullScreen
                        loading="lazy"
                      ></iframe>
                    </div>
                    
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${hotel.latitude},${hotel.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open in Google Maps
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* View Room Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  View Room Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hotel.roomCategories && hotel.roomCategories.length > 0 ? (
                  hotel.roomCategories.map((category: any) => (
                    <div
                      key={category.id}
                      className={`border-2 rounded-lg p-4 transition-all ${
                        selectedRoomCategory === category.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* Category Image */}
                        <div className="flex-shrink-0">
                          {category.images && category.images.length > 0 ? (
                            <img
                              src={category.images[0]}
                              alt={category.name}
                              className="w-32 h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-32 h-24 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center">
                              <span className="text-4xl">🛏️</span>
                            </div>
                          )}
                        </div>

                        {/* Category Details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">
                                {category.name}
                              </h3>
                              <p className="text-gray-600 mt-1">
                                {category.description}
                              </p>
                            </div>
                          </div>

                          {/* Room Details */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="info">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Max {category.maxGuests} guests
                            </Badge>
                            {(() => {
                              // Get real-time availability or fall back to database value
                              const realtimeData = getAvailability(category.id);
                              const availableRooms = realtimeData?.availableRooms ?? category.availableRooms;
                              const isRealtime = !!realtimeData;
                              
                              return (
                                <Badge variant={availableRooms > 0 ? "success" : "danger"}>
                                  {availableRooms > 0
                                    ? `${availableRooms} rooms available`
                                    : "Not available"}
                                  {isRealtime && (
                                    <span className="ml-1 inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Live updates" />
                                  )}
                                </Badge>
                              );
                            })()}
                          </div>

                          {/* Price per Guest Count */}
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Price per number of guests:
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {category.prices && category.prices.length > 0 ? (
                                category.prices
                                  .sort((a: any, b: any) => a.guestCount - b.guestCount)
                                  .map((price: any) => (
                                    <div
                                      key={price.id}
                                      className={`text-center p-2 rounded border ${
                                        selectedRoomCategory === category.id &&
                                        selectedGuestCount === price.guestCount
                                          ? "border-blue-500 bg-blue-100"
                                          : "border-gray-300"
                                      }`}
                                    >
                                      <p className="text-xs text-gray-600">
                                        {price.guestCount} {price.guestCount === 1 ? "guest" : "guests"}
                                      </p>
                                      <p className="font-bold text-blue-600">
                                        {formatCurrency(price.price)}
                                      </p>
                                    </div>
                                  ))
                              ) : (
                                <div className="col-span-4 text-center p-2 border border-gray-300 rounded">
                                  <p className="font-bold text-blue-600">
                                    {formatCurrency(category.basePrice || 0)}
                                  </p>
                                  <p className="text-xs text-gray-600">per night</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Book Now Button */}
                          <div className="mt-4">
                            {(() => {
                              // Get real-time availability or fall back to database value
                              const realtimeData = getAvailability(category.id);
                              const availableRooms = realtimeData?.availableRooms ?? category.availableRooms;
                              
                              return (
                                <Button
                                  onClick={() => {
                                    setSelectedRoomCategory(category.id);
                                    setSelectedGuestCount(1);
                                  }}
                                  variant={selectedRoomCategory === category.id ? "primary" : "outline"}
                                  disabled={availableRooms === 0}
                                  className="w-full md:w-auto"
                                >
                                  {availableRooms === 0
                                    ? "Not Available"
                                    : selectedRoomCategory === category.id
                                    ? "✓ Selected"
                                    : "Select Room"}
                                </Button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No room categories available at the moment
                  </p>
                )}
              </CardContent>
            </Card>

            {/* User Reviews Section - Enhanced */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Guest Reviews & Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview">
                  <TabsList className="mb-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="all-reviews">
                      Reviews ({hotel.totalReviews || 0})
                    </TabsTrigger>
                    <TabsTrigger value="write-review">Write Review</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview">
                    <RatingSummary
                      averageRating={hotel.rating || 0}
                      totalReviews={hotel.totalReviews || 0}
                      ratingDistribution={{
                        5: hotel.reviews?.filter((r: any) => r.rating === 5).length || 0,
                        4: hotel.reviews?.filter((r: any) => r.rating === 4).length || 0,
                        3: hotel.reviews?.filter((r: any) => r.rating === 3).length || 0,
                        2: hotel.reviews?.filter((r: any) => r.rating === 2).length || 0,
                        1: hotel.reviews?.filter((r: any) => r.rating === 1).length || 0,
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="all-reviews">
                    <ReviewList
                      reviews={reviewsData?.reviews || []}
                      isLoading={!reviewsData}
                    />
                    {reviewsData && reviewsData.pages > 1 && (
                      <div className="mt-6 flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                          disabled={reviewPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                          Page {reviewPage} of {reviewsData.pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewPage((p) => Math.min(reviewsData.pages, p + 1))}
                          disabled={reviewPage === reviewsData.pages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="write-review">
                    {session ? (
                      <ReviewForm
                        hotelId={hotelId}
                        onSuccess={() => {
                          refetchReviews();
                        }}
                      />
                    ) : (
                      <div className="rounded-lg border bg-gray-50 p-8 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">
                          Sign in to Write a Review
                        </h3>
                        <p className="mt-2 text-gray-600">
                          You need to be signed in and have a completed booking to review this hotel
                        </p>
                        <Button
                          onClick={() => router.push(`/signin?callbackUrl=/hotels/${hotelId}`)}
                          className="mt-4"
                        >
                          Sign In
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-xl">Book Your Stay</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Check-in */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Check-out */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Guests
                  </label>
                  <select
                    value={selectedGuestCount}
                    onChange={(e) => setSelectedGuestCount(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "Guest" : "Guests"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Room Info */}
                {selectedRoomCategory && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-900">Selected Room</p>
                    <p className="text-lg font-semibold text-blue-700">
                      {selectedRoom?.name}
                    </p>
                    <p className="text-sm text-blue-600">
                      {selectedGuestCount} {selectedGuestCount === 1 ? "guest" : "guests"}
                    </p>
                  </div>
                )}

                {/* Price Breakdown */}
                {selectedRoomCategory && checkIn && checkOut && numberOfNights > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>
                          {formatCurrency(selectedPrice)} × {numberOfNights}{" "}
                          {numberOfNights === 1 ? "night" : "nights"}
                        </span>
                        <span>{formatCurrency(selectedPrice * numberOfNights)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t">
                        <span>Total</span>
                        <span className="text-blue-600">{formatCurrency(totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Book Now Button */}
                <Button
                  onClick={handleBooking}
                  className="w-full"
                  size="lg"
                  isLoading={createBooking.isPending}
                  disabled={
                    !selectedRoomCategory ||
                    !checkIn ||
                    !checkOut ||
                    createBooking.isPending ||
                    numberOfNights <= 0
                  }
                >
                  {!session
                    ? "Sign in to Book"
                    : !selectedRoomCategory
                    ? "Select a Room"
                    : "Book Now"}
                </Button>

                {!session && (
                  <p className="text-xs text-gray-500 text-center">
                    <Link href="/auth/signin" className="text-blue-600 hover:underline">
                      Sign in
                    </Link>{" "}
                    to make a booking
                  </p>
                )}

                {/* Free Cancellation Notice */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-900">Free Cancellation</p>
                      <p className="text-xs text-green-700">
                        Cancel anytime before check-in for a full refund
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Carousel Modal */}
      <Modal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        size="xl"
      >
        <div className="bg-black min-h-screen flex items-center justify-center p-4">
          <div className="max-w-6xl w-full">
            {/* Close Button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image Counter */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
              {currentImageIndex + 1} / {hotelImages.length}
            </div>

            {/* Main Image */}
            <div className="relative">
              <img
                src={hotelImages[currentImageIndex]}
                alt={`${hotel.name} - ${currentImageIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />

              {/* Navigation Arrows */}
              {hotelImages.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === 0 ? hotelImages.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === hotelImages.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {hotelImages.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {hotelImages.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      currentImageIndex === index
                        ? "border-white"
                        : "border-transparent opacity-50 hover:opacity-75"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
