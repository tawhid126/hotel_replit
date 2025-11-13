"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/utils/trpc";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import { Modal } from "~/components/ui/Modal";
import { formatCurrency } from "~/lib/utils";
import toast from "react-hot-toast";
import { SeasonalOffersBanner } from "~/components/promotions/SeasonalOffersBanner";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchGuests, setSearchGuests] = useState("1");
  const [searchCheckIn, setSearchCheckIn] = useState("");
  const [searchCheckOut, setSearchCheckOut] = useState("");
  const [showNearbyModal, setShowNearbyModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"price" | "rating" | "distance">("rating");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const itemsPerPage = 10;

  // Fetch all hotels with pagination and filters
  const { data: hotelsData, isLoading } = api.hotel.getAll.useQuery({
    page: currentPage,
    limit: itemsPerPage,
    sortBy: sortBy,
    city: searchCity || undefined,
    search: searchQuery || undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    facilities: selectedFacilities.length > 0 ? selectedFacilities : undefined,
    latitude: userLocation?.latitude,
    longitude: userLocation?.longitude,
  });

  const hotels = hotelsData?.hotels || [];
  const totalPages = hotelsData?.pages || 0;
  const totalHotels = hotelsData?.total || 0;

  // Fetch featured hotels (top rated)
  const { data: featuredData } = api.hotel.getAll.useQuery({
    take: 6,
    sortBy: "rating",
  });

  const featuredHotels = featuredData?.hotels || [];

  // Fetch nearby hotels when user location is available
  const { data: nearbyHotels, isLoading: nearbyLoading } = api.hotel.getNearby.useQuery(
    {
      latitude: userLocation?.latitude || 0,
      longitude: userLocation?.longitude || 0,
      radius: 50, // 50 km radius
      limit: 10,
    },
    {
      enabled: !!userLocation && showNearbyModal,
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (searchCity) params.set("city", searchCity);
    if (searchGuests) params.set("guests", searchGuests);
    if (searchCheckIn) params.set("checkIn", searchCheckIn);
    if (searchCheckOut) params.set("checkOut", searchCheckOut);
    
    router.push(`/hotels?${params.toString()}`);
  };

  // Get user's current location
  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLoadingLocation(true);
    toast.loading("Getting your location...", { id: "location" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setSortBy("distance"); // Auto-sort by distance when location is found
        setCurrentPage(1); // Reset to first page
        setIsLoadingLocation(false);
        toast.success("Showing hotels sorted by distance!", { id: "location" });
      },
      (error) => {
        setIsLoadingLocation(false);
        toast.error("Unable to get your location. Please enable location services.", {
          id: "location",
        });
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Toggle facility filter
  const toggleFacility = (facility: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility)
        ? prev.filter((f) => f !== facility)
        : [...prev, facility]
    );
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Common facilities for filtering
  const commonFacilities = [
    "Free WiFi",
    "Swimming Pool",
    "Gym",
    "Restaurant",
    "Parking",
    "Air Conditioning",
    "Room Service",
    "Spa",
  ];

  return (
    <div className="min-h-screen">
      {/* Seasonal Offers Banner */}
      <SeasonalOffersBanner />
      
      {/* Hero Section with Search */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">
              Find Your Perfect Stay
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Book luxury rooms and suites at the best prices with StayComfort
            </p>

            {/* Search Form */}
            <form
              onSubmit={handleSearch}
              className="bg-white rounded-lg shadow-2xl p-6 text-gray-900"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Location Search */}
                <div className="md:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Where are you going?
                  </label>
                  <Input
                    type="text"
                    placeholder="Hotel name or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Check-in Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Check-in
                  </label>
                  <Input
                    type="date"
                    value={searchCheckIn}
                    onChange={(e) => setSearchCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full"
                  />
                </div>

                {/* Check-out Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Check-out
                  </label>
                  <Input
                    type="date"
                    value={searchCheckOut}
                    onChange={(e) => setSearchCheckOut(e.target.value)}
                    min={searchCheckIn || new Date().toISOString().split('T')[0]}
                    className="w-full"
                  />
                </div>

                {/* City Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    City
                  </label>
                  <select
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Cities</option>
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chittagong">Chittagong</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Cox's Bazar">Cox's Bazar</option>
                    <option value="Khulna">Khulna</option>
                    <option value="Rajshahi">Rajshahi</option>
                  </select>
                </div>

                {/* Guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Guests
                  </label>
                  <select
                    value={searchGuests}
                    onChange={(e) => setSearchGuests(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="3">3 Guests</option>
                    <option value="4">4 Guests</option>
                    <option value="5">5+ Guests</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full md:w-auto mt-6 px-12"
                size="lg"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                Search Hotels
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full md:w-auto mt-6 md:ml-4 px-8"
                size="lg"
                onClick={handleFindNearby}
                isLoading={isLoadingLocation}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Find Nearest Hotels
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Popular Destinations
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Dhaka", image: "🏙️", hotels: 150 },
              { name: "Chittagong", image: "🌊", hotels: 85 },
              { name: "Sylhet", image: "🏔️", hotels: 65 },
              { name: "Cox's Bazar", image: "🏖️", hotels: 120 },
              { name: "Khulna", image: "🌳", hotels: 45 },
              { name: "Rajshahi", image: "🏛️", hotels: 40 },
            ].map((city) => (
              <Link
                key={city.name}
                href={`/hotels?city=${city.name}`}
                className="group"
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{city.image}</div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                      {city.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {city.hotels} hotels
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Hotels */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Featured Hotels
            </h2>
            <Link href="/hotels">
              <Button variant="outline">View All Hotels</Button>
            </Link>
          </div>

          {featuredHotels.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No hotels available yet</p>
              <Link href="/hotels">
                <Button>Browse All Hotels</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredHotels.map((hotel: any) => (
                <Link key={hotel.id} href={`/hotels/${hotel.id}`}>
                  <Card className="hover:shadow-xl transition-shadow cursor-pointer h-full">
                    {/* Hotel Image */}
                    <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600 rounded-t-lg">
                      {hotel.images && hotel.images.length > 0 ? (
                        <img
                          src={hotel.images[0]}
                          alt={hotel.name}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-white text-6xl">
                          🏨
                        </div>
                      )}
                      {/* Rating Badge */}
                      <div className="absolute top-3 right-3 bg-white rounded-lg px-3 py-1 shadow-lg">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="font-semibold text-gray-900">
                            {hotel.rating?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <CardHeader>
                      <CardTitle className="text-xl">{hotel.name}</CardTitle>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
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
                        {hotel.city}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {hotel.description}
                      </p>

                      {/* Facilities */}
                      {hotel.facilities && hotel.facilities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {hotel.facilities.slice(0, 3).map((facility: string) => (
                            <Badge key={facility} variant="info">
                              {facility}
                            </Badge>
                          ))}
                          {hotel.facilities.length > 3 && (
                            <Badge variant="info">
                              +{hotel.facilities.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        {/* Price */}
                        <div>
                          <p className="text-sm text-gray-500">Starting from</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {hotel.roomCategories &&
                            hotel.roomCategories.length > 0
                              ? formatCurrency(
                                  Math.min(
                                    ...hotel.roomCategories.flatMap((cat: any) =>
                                      cat.prices.map((p: any) => p.price)
                                    )
                                  )
                                )
                              : "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">per night</p>
                        </div>

                        {/* Reviews */}
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {hotel._count?.reviews || 0} reviews
                          </p>
                          <Button size="sm" className="mt-2">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Why Book With StayComfort?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: "💰",
                title: "Best Price Guarantee",
                description: "Find the lowest prices or we'll refund the difference",
              },
              {
                icon: "🔒",
                title: "Secure Booking",
                description: "Your payment information is always safe and secure",
              },
              {
                icon: "🎯",
                title: "Easy Cancellation",
                description: "Cancel anytime before check-in with full refund",
              },
              {
                icon: "⭐",
                title: "Verified Reviews",
                description: "Read genuine reviews from real guests",
              },
            ].map((feature) => (
              <Card key={feature.title} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* All Hotels Section with Filters */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                All Available Hotels
              </h2>
              <p className="text-gray-600 mt-2">
                Showing {hotels.length} of {totalHotels} hotels
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value as "price" | "rating" | "distance");
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="rating">Highest Rating</option>
                      <option value="price">Lowest Price</option>
                      {userLocation && <option value="distance">Nearest First</option>}
                    </select>
                  </div>

                  {/* City Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <select
                      value={searchCity}
                      onChange={(e) => {
                        setSearchCity(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Cities</option>
                      <option value="Dhaka">Dhaka</option>
                      <option value="Chittagong">Chittagong</option>
                      <option value="Sylhet">Sylhet</option>
                      <option value="Cox's Bazar">Cox's Bazar</option>
                      <option value="Khulna">Khulna</option>
                      <option value="Rajshahi">Rajshahi</option>
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Range (BDT)
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="50000"
                        step="1000"
                        value={priceRange[1]}
                        onChange={(e) => {
                          setPriceRange([priceRange[0], parseInt(e.target.value)]);
                          setCurrentPage(1);
                        }}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{formatCurrency(priceRange[0])}</span>
                        <span>{formatCurrency(priceRange[1])}</span>
                      </div>
                    </div>
                  </div>

                  {/* Facilities Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Facilities
                    </label>
                    <div className="space-y-2">
                      {commonFacilities.map((facility) => (
                        <label
                          key={facility}
                          className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFacilities.includes(facility)}
                            onChange={() => toggleFacility(facility)}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{facility}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSearchCity("");
                      setPriceRange([0, 50000]);
                      setSelectedFacilities([]);
                      setSortBy("rating");
                      setUserLocation(null);
                      setCurrentPage(1);
                    }}
                  >
                    Clear All Filters
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Hotels Grid */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : hotels.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <p className="text-gray-500 text-lg mb-2">No hotels found</p>
                  <p className="text-gray-400 text-sm mb-4">
                    Try adjusting your filters or search criteria
                  </p>
                  <Button
                    onClick={() => {
                      setSearchCity("");
                      setPriceRange([0, 50000]);
                      setSelectedFacilities([]);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {hotels.map((hotel: any) => (
                      <Link key={hotel.id} href={`/hotels/${hotel.id}`}>
                        <Card className="hover:shadow-xl transition-shadow cursor-pointer h-full">
                          {/* Hotel Image */}
                          <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600 rounded-t-lg">
                            {hotel.images && hotel.images.length > 0 ? (
                              <img
                                src={hotel.images[0]}
                                alt={hotel.name}
                                className="w-full h-full object-cover rounded-t-lg"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-white text-6xl">
                                🏨
                              </div>
                            )}
                            {/* Rating Badge */}
                            <div className="absolute top-3 right-3 bg-white rounded-lg px-3 py-1 shadow-lg">
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-500">⭐</span>
                                <span className="font-semibold text-gray-900">
                                  {hotel.rating?.toFixed(1) || "N/A"}
                                </span>
                              </div>
                            </div>
                            {/* Distance Badge */}
                            {hotel.distance !== undefined && (
                              <div className="absolute top-3 left-3 bg-blue-600 text-white rounded-lg px-3 py-1 shadow-lg">
                                <div className="flex items-center gap-1 text-sm font-medium">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {hotel.distance.toFixed(1)} km
                                </div>
                              </div>
                            )}
                          </div>

                          <CardHeader>
                            <CardTitle className="text-xl">{hotel.name}</CardTitle>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
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
                              {hotel.city}
                            </div>
                          </CardHeader>

                          <CardContent>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {hotel.description}
                            </p>

                            {/* Facilities */}
                            {hotel.facilities && hotel.facilities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-4">
                                {hotel.facilities.slice(0, 3).map((facility: string) => (
                                  <Badge key={facility} variant="info">
                                    {facility}
                                  </Badge>
                                ))}
                                {hotel.facilities.length > 3 && (
                                  <Badge variant="info">
                                    +{hotel.facilities.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                              {/* Price */}
                              <div>
                                <p className="text-sm text-gray-500">Starting from</p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {hotel.roomCategories &&
                                  hotel.roomCategories.length > 0
                                    ? formatCurrency(
                                        Math.min(
                                          ...hotel.roomCategories.flatMap((cat: any) =>
                                            cat.prices.map((p: any) => p.price)
                                          )
                                        )
                                      )
                                    : "N/A"}
                                </p>
                                <p className="text-xs text-gray-500">per night</p>
                              </div>

                              {/* Reviews */}
                              <div className="text-right">
                                <p className="text-sm text-gray-500">
                                  {hotel._count?.reviews || 0} reviews
                                </p>
                                <Button size="sm" className="mt-2">
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                      </Button>

                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "primary" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 hidden">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Why Book With Us?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: "💰",
                title: "Best Price Guarantee",
                description: "Find the lowest prices or we'll refund the difference",
              },
              {
                icon: "🔒",
                title: "Secure Booking",
                description: "Your payment information is always safe and secure",
              },
              {
                icon: "🎯",
                title: "Easy Cancellation",
                description: "Cancel anytime before check-in with full refund",
              },
              {
                icon: "⭐",
                title: "Verified Reviews",
                description: "Read genuine reviews from real guests",
              },
            ].map((feature) => (
              <Card key={feature.title} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of happy travelers and book your perfect stay today
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/hotels">
              <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-gray-100">
                Browse Hotels
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-900 hover:bg-blue-950">
                Sign Up Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Nearby Hotels Modal */}
      <Modal
        isOpen={showNearbyModal}
        onClose={() => setShowNearbyModal(false)}
        size="xl"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Nearest Hotels to You
              </h2>
              {userLocation && (
                <p className="text-sm text-gray-600 mt-1">
                  📍 Based on your current location
                </p>
              )}
            </div>
            <button
              onClick={() => setShowNearbyModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {nearbyLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : !nearbyHotels || nearbyHotels.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-gray-500 text-lg mb-2">No hotels found nearby</p>
              <p className="text-gray-400 text-sm mb-4">
                Try expanding your search radius or browse all hotels
              </p>
              <Link href="/hotels">
                <Button>Browse All Hotels</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {nearbyHotels.map((hotel: any) => (
                <Link key={hotel.id} href={`/hotels/${hotel.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex gap-4 p-4">
                      {/* Hotel Image */}
                      <div className="relative w-32 h-32 flex-shrink-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg overflow-hidden">
                        {hotel.images && hotel.images.length > 0 ? (
                          <img
                            src={hotel.images[0]}
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-white text-4xl">
                            🏨
                          </div>
                        )}
                      </div>

                      {/* Hotel Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {hotel.name}
                            </h3>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
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
                              {hotel.city}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded">
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              <span className="text-sm font-semibold text-blue-600">
                                {hotel.distance?.toFixed(1)} km
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                          {hotel.description}
                        </p>

                        {/* Facilities */}
                        {hotel.facilities && hotel.facilities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {hotel.facilities.slice(0, 3).map((facility: string) => (
                              <Badge key={facility} variant="info">
                                {facility}
                              </Badge>
                            ))}
                            {hotel.facilities.length > 3 && (
                              <Badge variant="info">
                                +{hotel.facilities.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-500">⭐</span>
                            <span className="font-semibold text-gray-900">
                              {hotel.rating?.toFixed(1) || "N/A"}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({hotel._count?.reviews || 0} reviews)
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Starting from</p>
                            <p className="text-lg font-bold text-blue-600">
                              {hotel.roomCategories && hotel.roomCategories.length > 0
                                ? formatCurrency(
                                    Math.min(
                                      ...hotel.roomCategories.flatMap((cat: any) =>
                                        cat.prices.map((p: any) => p.price)
                                      )
                                    )
                                  )
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
