'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Badge } from '~/components/ui/Badge';
import {
  fetchNearbyPlaces,
  getMockNearbyPlaces,
  formatDistance,
  getPriceLevelText,
  PLACE_TYPES,
  type NearbyPlace,
} from '~/lib/google-places';

interface NearbyAttractionsProps {
  latitude: number;
  longitude: number;
  radius?: number; // in meters
  useMockData?: boolean;
}

export function NearbyAttractions({
  latitude,
  longitude,
  radius = 2000,
  useMockData = false,
}: NearbyAttractionsProps) {
  const [selectedType, setSelectedType] = useState('restaurant');
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlaces();
  }, [selectedType, latitude, longitude]);

  const loadPlaces = async () => {
    setLoading(true);
    try {
      let results: NearbyPlace[];
      
      if (useMockData || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        // Use mock data in development or if API key is not configured
        results = getMockNearbyPlaces(selectedType);
      } else {
        // Use real Google Places API
        results = await fetchNearbyPlaces(latitude, longitude, selectedType, radius);
      }
      
      // Sort by distance
      results.sort((a, b) => a.distance - b.distance);
      setPlaces(results);
    } catch (error) {
      console.error('Error loading places:', error);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📍</span>
          Nearby Attractions & Facilities
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {PLACE_TYPES.map((type) => (
            <button
              key={type.type}
              onClick={() => setSelectedType(type.type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedType === type.type
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        )}

        {/* Places List */}
        {!loading && places.length > 0 && (
          <div className="space-y-4">
            {places.map((place) => (
              <div
                key={place.id}
                className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* Place Image */}
                {place.photoUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={place.photoUrl}
                      alt={place.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  </div>
                )}

                {/* Place Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {place.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {place.address}
                      </p>
                    </div>
                    <Badge className="flex-shrink-0 bg-blue-100 text-blue-700">
                      {formatDistance(place.distance)}
                    </Badge>
                  </div>

                  {/* Rating and Details */}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {place.rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-sm font-medium text-gray-700">
                          {place.rating.toFixed(1)}
                        </span>
                        {place.userRatingsTotal && (
                          <span className="text-xs text-gray-500">
                            ({place.userRatingsTotal.toLocaleString()})
                          </span>
                        )}
                      </div>
                    )}

                    {place.priceLevel && (
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-700">
                          {getPriceLevelText(place.priceLevel)}
                        </span>
                      </div>
                    )}

                    {place.isOpen !== undefined && (
                      <Badge
                        className={
                          place.isOpen
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }
                      >
                        {place.isOpen ? '🟢 Open' : '🔴 Closed'}
                      </Badge>
                    )}
                  </div>

                  {/* Directions Button */}
                  <div className="mt-3">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        place.name
                      )}&query_place_id=${place.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                      Get Directions
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && places.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-600">
              No {PLACE_TYPES.find((t) => t.type === selectedType)?.label.toLowerCase()} found nearby
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Try selecting a different category
            </p>
          </div>
        )}

        {/* Info Message */}
        {useMockData && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Displaying sample data. Configure Google Places API key in
              environment variables for real data.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
