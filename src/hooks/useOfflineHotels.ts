import { useEffect, useRef } from 'react';

// IndexedDB configuration
const DB_NAME = 'staycomfort-db';
const HOTELS_STORE = 'hotels';
const MAX_CACHED_HOTELS = 10;

interface HotelData {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  pricePerNight: number;
  rating: number;
  imageUrl: string | null;
  timestamp: number;
}

/**
 * Open IndexedDB database
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(HOTELS_STORE)) {
        const store = db.createObjectStore(HOTELS_STORE, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Save hotel to IndexedDB
 */
async function saveHotelToDB(hotel: HotelData): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([HOTELS_STORE], 'readwrite');
  const store = transaction.objectStore(HOTELS_STORE);

  // Add timestamp
  const hotelWithTimestamp = {
    ...hotel,
    timestamp: Date.now(),
  };

  await store.put(hotelWithTimestamp);

  // Cleanup old hotels (keep only MAX_CACHED_HOTELS)
  const index = store.index('timestamp');
  const allHotels = await new Promise<HotelData[]>((resolve, reject) => {
    const request = index.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (allHotels.length > MAX_CACHED_HOTELS) {
    const sortedHotels = allHotels.sort((a, b) => a.timestamp - b.timestamp);
    const hotelsToDelete = sortedHotels.slice(0, allHotels.length - MAX_CACHED_HOTELS);

    for (const oldHotel of hotelsToDelete) {
      await store.delete(oldHotel.id);
    }
  }

  db.close();
}

/**
 * Get hotel from IndexedDB
 */
export async function getHotelFromDB(hotelId: string): Promise<HotelData | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction([HOTELS_STORE], 'readonly');
    const store = transaction.objectStore(HOTELS_STORE);

    const hotel = await new Promise<HotelData | undefined>((resolve, reject) => {
      const request = store.get(hotelId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return hotel ?? null;
  } catch (error) {
    console.error('Error getting hotel from IndexedDB:', error);
    return null;
  }
}

/**
 * Get all cached hotels from IndexedDB
 */
export async function getAllCachedHotels(): Promise<HotelData[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction([HOTELS_STORE], 'readonly');
    const store = transaction.objectStore(HOTELS_STORE);
    const index = store.index('timestamp');

    const hotels = await new Promise<HotelData[]>((resolve, reject) => {
      const request = index.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    
    // Return hotels sorted by timestamp (newest first)
    return hotels.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting cached hotels:', error);
    return [];
  }
}

/**
 * Clear all cached hotels
 */
export async function clearCachedHotels(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([HOTELS_STORE], 'readwrite');
    const store = transaction.objectStore(HOTELS_STORE);
    await store.clear();
    db.close();
  } catch (error) {
    console.error('Error clearing cached hotels:', error);
  }
}

/**
 * React hook to automatically save hotels to IndexedDB when viewed
 */
export function useOfflineHotels(hotel: HotelData | null | undefined) {
  const savedRef = useRef(false);

  useEffect(() => {
    // Only save once per hotel
    if (hotel && !savedRef.current) {
      saveHotelToDB(hotel)
        .then(() => {
          savedRef.current = true;
          console.log('Hotel saved to IndexedDB for offline viewing:', hotel.name);
        })
        .catch((error) => {
          console.error('Error saving hotel to IndexedDB:', error);
        });
    }
  }, [hotel]);

  return {
    getHotelFromDB,
    getAllCachedHotels,
    clearCachedHotels,
  };
}
