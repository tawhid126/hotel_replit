"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
// Disable static prerendering for this page due to client-side search params usage
export const dynamic = "force-dynamic";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "~/utils/trpc";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Card } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";

type SortOption = "popularity" | "price-low" | "price-high" | "rating";
type ViewMode = "list" | "map";

// Minimal hotel type used by this page to avoid `any`
type Price = { price: number; guestCount?: number };
type RoomCategory = { prices?: Price[] };
type Hotel = {
  id: string;
  name: string;
  city?: string;
  address?: string;
  images?: string[];
  rating?: number;
  totalReviews?: number;
  _count?: { reviews?: number; bookings?: number; roomCategories?: number };
  roomCategories?: RoomCategory[];
  latitude?: number;
  longitude?: number;
  facilities?: string[];
};

function HotelsPageInner() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState<SortOption>("popularity");
  const [selectedCity, setSelectedCity] = useState<string>(searchParams.get("city") || "");
  const latParam = useMemo(() => parseFloat(searchParams.get("lat") || ""), [searchParams]);
  const lngParam = useMemo(() => parseFloat(searchParams.get("lng") || ""), [searchParams]);
  const radiusParam = useMemo(() => parseFloat(searchParams.get("radius") || "10"), [searchParams]);
  const hasCoords = !Number.isNaN(latParam) && !Number.isNaN(lngParam);
  const [radius, setRadius] = useState<number>(Number.isNaN(radiusParam) ? 10 : radiusParam);

  // Debounce search text to reduce refetch thrash
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);
  
  // Fetch hotels
  const allQuery = api.hotel.getAll.useQuery(
    {
      skip: 0,
      take: 50,
      search: debouncedSearch || undefined,
      city: selectedCity || undefined,
    },
    {
      enabled: !hasCoords,
    }
  );

  const nearbyQuery = api.hotel.getNearby.useQuery(
    {
      latitude: hasCoords ? latParam : 0,
      longitude: hasCoords ? lngParam : 0,
      radius,
      limit: 50,
    },
    {
      enabled: hasCoords,
    }
  );

  const isLoading = hasCoords ? nearbyQuery.isLoading : allQuery.isLoading;
  const hotels: Hotel[] = (hasCoords ? (nearbyQuery.data as Hotel[] | undefined) : (allQuery.data?.hotels as Hotel[] | undefined)) || [];

  // Sort hotels based on selected option
  const sortedHotels: Hotel[] = [...hotels].sort((a: Hotel, b: Hotel) => {
    switch (sortBy) {
      case "popularity":
        return (b.totalReviews || 0) - (a.totalReviews || 0);
      case "price-low":
        {
          const minPriceA = getMinPrice(a);
          const minPriceB = getMinPrice(b);
          return minPriceA - minPriceB;
        }
      case "price-high":
        {
          const maxPriceA = getMinPrice(a);
          const maxPriceB = getMinPrice(b);
          return maxPriceB - maxPriceA;
        }
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  // Update URL params when filters change
  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    const params = new URLSearchParams(current.toString());
    // Update or remove search and city while preserving lat/lng if present
    if (debouncedSearch) params.set("search", debouncedSearch); else params.delete("search");
    if (selectedCity) params.set("city", selectedCity); else params.delete("city");
    // If we have coordinates, ensure radius is reflected; otherwise drop it
    if (hasCoords) params.set("radius", String(radius)); else params.delete("radius");
    window.history.replaceState({}, "", `?${params.toString()}`);
  }, [debouncedSearch, selectedCity, hasCoords, radius]);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Search hotels, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
              <span className="text-sm font-medium px-3">Map View</span>
              <button
                onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  viewMode === "map" ? "bg-red-600" : "bg-gray-300"
                }`}
                aria-label="Toggle map view"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    viewMode === "map" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort By</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="popularity">Popularity</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Rating</option>
              </select>
            </div>

            {/* Radius selector (only when searching by location) */}
            {hasCoords && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Radius</span>
                <select
                  value={radius}
                  onChange={(e) => setRadius(parseFloat(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value={2}>2 km</option>
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={20}>20 km</option>
                  <option value={30}>30 km</option>
                </select>
              </div>
            )}

            {/* City Filter */}
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
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
        </div>
      </div>

      {/* Discount Banner */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 max-w-7xl mx-auto mt-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <p className="text-gray-800 font-medium">
            upto 80% off. Valid until 31st Dec 2025.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === "list" ? (
          <ListView hotels={sortedHotels} isLoading={isLoading} />
        ) : (
          <MapView hotels={sortedHotels} />
        )}
      </div>
    </div>
  );
}

export default function HotelsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading hotels…</div>}>
      <HotelsPageInner />
    </Suspense>
  );
}

// Helper function to get minimum price from hotel
function getMinPrice(hotel: Hotel): number {
  if (!hotel.roomCategories || hotel.roomCategories.length === 0) return 0;
  const minPrice = hotel.roomCategories.reduce((min: number, category: RoomCategory) => {
    if (!category.prices || category.prices.length === 0) return min;
    const categoryMin = category.prices.reduce(
      (catMin: number, price: Price) => Math.min(catMin, price.price),
      Infinity
    );
    return Math.min(min, categoryMin);
  }, Infinity);
  return minPrice !== Infinity ? minPrice : 0;
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function for facility icons
function getFacilityIcon(facility: string) {
  const icons: Record<string, string> = {
    "Parking": "🚗",
    "Reception": "🏨",
    "WiFi": "📶",
    "Free Wifi": "📶",
    "Pool": "🏊",
    "Swimming Pool": "🏊",
    "Gym": "💪",
    "Restaurant": "🍽️",
    "Spa": "💆",
    "Bar": "🍸",
    "AC": "❄️",
    "Air Conditioning": "❄️",
  };
  return <span>{icons[facility] || "✓"}</span>;
}

// List View Component
function ListView({ hotels, isLoading }: { hotels: Hotel[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (hotels.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No hotels found</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-gray-600 mb-4">{hotels.length} Hotels in Aroundme</p>
      <div className="space-y-4">
        {hotels.map((hotel) => (
          <HotelCard key={hotel.id} hotel={hotel} />
        ))}
      </div>
    </div>
  );
}

// Hotel Card Component (OYO Style)
function HotelCard({ hotel }: { hotel: Hotel }) {
  const [distance, setDistance] = useState<number | null>(null);

  // Calculate distance from user location
  useEffect(() => {
    if (navigator.geolocation && hotel.latitude != null && hotel.longitude != null) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const dist = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            hotel.latitude!,
            hotel.longitude!
          );
          setDistance(dist);
        },
        () => setDistance(null)
      );
    }
  }, [hotel.latitude, hotel.longitude]);

  // Get minimum price from room categories
  const minPrice = getMinPrice(hotel);
  const originalPrice = minPrice > 0 ? Math.round(minPrice * 1.5) : 0;
  const discount = minPrice > 0 ? Math.round(((originalPrice - minPrice) / originalPrice) * 100) : 0;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow">
      <div className="flex flex-col md:flex-row">
        {/* Images */}
        <div className="md:w-1/3 relative">
          <div className="grid grid-cols-2 gap-1 h-full min-h-[250px]">
            {hotel.images?.slice(0, 4).map((image: string, index: number) => (
              <div key={index} className="relative aspect-square">
                <Image
                  src={image}
                  alt={hotel.name}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
            {(!hotel.images || hotel.images.length === 0) && (
              <div className="col-span-2 flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white text-6xl">
                🏨
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="md:w-2/3 p-6">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {hotel.name}
              </h3>
              <p className="text-gray-600 text-sm">
                {hotel.address}, {hotel.city}
              </p>
            </div>
            {distance !== null && (
              <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <span>📍</span>
                <span>{distance.toFixed(1)} km</span>
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-green-600 text-white px-2 py-1">
              {(hotel.rating ?? 5).toFixed(1)} ⭐
            </Badge>
            <span className="text-sm text-gray-600">
              ({hotel._count?.reviews || hotel.totalReviews || 1} Ratings)
            </span>
            <span className="text-sm text-gray-500">
              • {(hotel.rating ?? 0) >= 4.5 ? "Fabulous" : (hotel.rating ?? 0) >= 4 ? "Very Good" : "Good"}
            </span>
          </div>

          {/* Amenities */}
          {hotel.facilities && hotel.facilities.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-700">
              {hotel.facilities.slice(0, 3).map((facility: string) => (
                <div key={facility} className="flex items-center gap-1">
                  {getFacilityIcon(facility)}
                  <span>{facility}</span>
                </div>
              ))}
              {hotel.facilities.length > 3 && (
                <span className="text-red-600 font-medium">
                  + {hotel.facilities.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Membership Badge */}
          {(hotel.rating ?? 0) >= 4.5 && (
            <Badge variant="default" className="mb-4 bg-purple-100 text-purple-700">
              🎖️ WIZARD MEMBER
            </Badge>
          )}

          {/* Price Section */}
          <div className="flex items-end justify-between pt-4 border-t">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  ৳{minPrice.toLocaleString()}
                </span>
                {discount > 0 && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      ৳{originalPrice.toLocaleString()}
                    </span>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      {discount}% off
                    </Badge>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                + ৳{Math.round(minPrice * 0.2).toLocaleString()} taxes & fees · per room per night
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Link href={`/hotels/${hotel.id}`}>
                <Button variant="outline" size="lg">
                  View Details
                </Button>
              </Link>
              <Link href={`/hotels/${hotel.id}`}>
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  Book Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Map View Component
function MapView({ hotels }: { hotels: Hotel[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-250px)]">
      {/* Hotel List Sidebar */}
      <div className="lg:col-span-1 overflow-y-auto space-y-3 pr-2">
        {hotels.map((hotel) => {
          const minPrice = getMinPrice(hotel);
          const originalPrice = minPrice > 0 ? Math.round(minPrice * 1.5) : 0;
          const discount = minPrice > 0 ? Math.round(((originalPrice - minPrice) / originalPrice) * 100) : 0;
          
          return (
            <Link key={hotel.id} href={`/hotels/${hotel.id}`}>
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex gap-3">
                  {hotel.images?.[0] ? (
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <Image
                        src={hotel.images[0]}
                        alt={hotel.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 flex-shrink-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center text-white text-3xl">
                      🏨
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1 truncate">{hotel.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">{hotel.city}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-green-600 text-white text-xs px-1.5 py-0.5">
                        {hotel.rating?.toFixed(1) || "5.0"} ⭐
                      </Badge>
                      <span className="text-sm font-bold">৳{minPrice.toLocaleString()}</span>
                      {discount > 0 && (
                        <>
                          <span className="text-xs text-gray-400 line-through">
                            ৳{originalPrice.toLocaleString()}
                          </span>
                          <span className="text-xs text-green-600 font-medium">
                            {discount}% off
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Map */}
      <div className="lg:col-span-2 bg-gray-200 rounded-lg relative overflow-hidden">
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <input type="checkbox" id="search-move" className="rounded" />
            <label htmlFor="search-move" className="text-sm cursor-pointer select-none">
              Search as I move map
            </label>
          </div>
        </div>
        <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="text-center">
            <p className="text-4xl mb-4">🗺️</p>
            <p className="text-lg font-semibold mb-2">Google Maps Integration</p>
            <p className="text-sm text-gray-600">Map will be integrated with Google Maps API</p>
            <p className="text-xs text-gray-400 mt-2">
              Showing {hotels.length} hotels on map
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
