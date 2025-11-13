/**
 * Google Places API Integration
 * Fetches nearby attractions, restaurants, hospitals, etc.
 */

interface PlaceType {
  type: string;
  label: string;
  icon: string;
}

export const PLACE_TYPES: PlaceType[] = [
  { type: 'restaurant', label: 'Restaurants', icon: '🍽️' },
  { type: 'hospital', label: 'Hospitals', icon: '🏥' },
  { type: 'shopping_mall', label: 'Shopping Malls', icon: '🛍️' },
  { type: 'tourist_attraction', label: 'Tourist Attractions', icon: '🎭' },
  { type: 'atm', label: 'ATMs', icon: '🏧' },
  { type: 'gas_station', label: 'Gas Stations', icon: '⛽' },
  { type: 'pharmacy', label: 'Pharmacies', icon: '💊' },
  { type: 'bank', label: 'Banks', icon: '🏦' },
];

export interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  distance: number; // in meters
  rating?: number;
  userRatingsTotal?: number;
  photoUrl?: string;
  isOpen?: boolean;
  priceLevel?: number;
  types: string[];
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Fetch nearby places using Google Places API (Text Search)
 * This is a browser-side implementation
 */
export async function fetchNearbyPlaces(
  latitude: number,
  longitude: number,
  type: string,
  radius: number = 2000 // 2km default
): Promise<NearbyPlace[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('Google Maps API key not configured');
    return [];
  }

  try {
    // Using Places API Text Search
    const query = encodeURIComponent(type);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&location=${latitude},${longitude}&radius=${radius}&key=${apiKey}`;

    // Note: This should be called from the server-side to avoid CORS
    // In production, create a tRPC endpoint for this
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Places API error:', data.status);
      return [];
    }

    return data.results.slice(0, 10).map((place: any) => ({
      id: place.place_id,
      name: place.name,
      address: place.formatted_address || place.vicinity,
      distance: calculateDistance(
        latitude,
        longitude,
        place.geometry.location.lat,
        place.geometry.location.lng
      ),
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      photoUrl: place.photos?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${apiKey}`
        : undefined,
      isOpen: place.opening_hours?.open_now,
      priceLevel: place.price_level,
      types: place.types,
    }));
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return [];
  }
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  } else {
    return `${(meters / 1000).toFixed(1)} km`;
  }
}

/**
 * Get price level text
 */
export function getPriceLevelText(level?: number): string {
  if (!level) return 'N/A';
  return '৳'.repeat(level);
}

/**
 * Mock data for development (when API key is not available)
 */
export function getMockNearbyPlaces(type: string): NearbyPlace[] {
  const mockData: Record<string, NearbyPlace[]> = {
    restaurant: [
      {
        id: '1',
        name: 'The Sultan\'s Dine',
        address: '123 Main Street, Dhaka',
        distance: 250,
        rating: 4.5,
        userRatingsTotal: 1200,
        isOpen: true,
        priceLevel: 3,
        types: ['restaurant', 'food'],
      },
      {
        id: '2',
        name: 'Spice Garden',
        address: '456 Park Road, Dhaka',
        distance: 450,
        rating: 4.2,
        userRatingsTotal: 850,
        isOpen: true,
        priceLevel: 2,
        types: ['restaurant', 'food'],
      },
    ],
    hospital: [
      {
        id: '3',
        name: 'Square Hospital',
        address: '18/F Bir Uttam Qazi Nuruzzaman Sarak, Dhaka 1205',
        distance: 1200,
        rating: 4.3,
        userRatingsTotal: 500,
        isOpen: true,
        types: ['hospital', 'health'],
      },
      {
        id: '4',
        name: 'United Hospital',
        address: 'Plot 15, Road 71, Gulshan, Dhaka 1212',
        distance: 1500,
        rating: 4.4,
        userRatingsTotal: 650,
        isOpen: true,
        types: ['hospital', 'health'],
      },
    ],
    shopping_mall: [
      {
        id: '5',
        name: 'Bashundhara City',
        address: 'Panthapath, Dhaka 1215',
        distance: 800,
        rating: 4.1,
        userRatingsTotal: 15000,
        isOpen: true,
        types: ['shopping_mall', 'point_of_interest'],
      },
    ],
    tourist_attraction: [
      {
        id: '6',
        name: 'Ahsan Manzil',
        address: 'Kumartoli, Dhaka 1000',
        distance: 3000,
        rating: 4.6,
        userRatingsTotal: 2500,
        isOpen: true,
        types: ['tourist_attraction', 'museum'],
      },
      {
        id: '7',
        name: 'Lalbagh Fort',
        address: 'Lalbagh Rd, Dhaka 1211',
        distance: 3500,
        rating: 4.5,
        userRatingsTotal: 3200,
        isOpen: true,
        types: ['tourist_attraction', 'point_of_interest'],
      },
    ],
  };

  return mockData[type] || [];
}
