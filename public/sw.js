const CACHE_NAME = 'staycomfort-v2';
const DYNAMIC_CACHE = 'staycomfort-dynamic-v2';
const IMAGE_CACHE = 'staycomfort-images-v2';
const API_CACHE = 'staycomfort-api-v2';

const urlsToCache = [
  '/',
  '/hotels',
  '/profile',
  '/contact',
  '/faq',
  '/offline.html',
  '/manifest.json',
];

// IndexedDB for offline hotels
const DB_NAME = 'staycomfort-db';
const DB_VERSION = 1;
const HOTELS_STORE = 'hotels';
const MAX_CACHED_HOTELS = 10;

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(HOTELS_STORE)) {
        const store = db.createObjectStore(HOTELS_STORE, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Save hotel to IndexedDB
async function saveHotelToDB(hotel) {
  try {
    const db = await openDB();
    const transaction = db.transaction([HOTELS_STORE], 'readwrite');
    const store = transaction.objectStore(HOTELS_STORE);
    
    hotel.timestamp = Date.now();
    await store.put(hotel);
    
    // Keep only last 10 hotels
    const index = store.index('timestamp');
    const allHotels = await index.openCursor(null, 'prev');
    let count = 0;
    
    allHotels.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        count++;
        if (count > MAX_CACHED_HOTELS) {
          store.delete(cursor.primaryKey);
        }
        cursor.continue();
      }
    };
  } catch (error) {
    console.error('Error saving hotel to DB:', error);
  }
}

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing v2...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('Service Worker: Cache failed:', error);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating v2...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== IMAGE_CACHE &&
              cacheName !== API_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Enhanced caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin and non-GET requests
  if (!request.url.startsWith(self.location.origin) || request.method !== 'GET') {
    return;
  }

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || new Response(JSON.stringify({ 
              error: 'Offline', 
              message: 'You are currently offline' 
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Images - Cache first, fallback to network
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cached) => {
          return cached || fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          }).catch(() => {
            // Return placeholder image when offline
            return new Response(
              '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#e5e7eb"/><text x="50%" y="50%" text-anchor="middle" fill="#9ca3af">Image Unavailable</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          });
        });
      })
    );
    return;
  }

  // HTML pages - Network first, cache fallback
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          
          // Save hotel data to IndexedDB for offline viewing
          if (url.pathname.startsWith('/hotels/')) {
            response.clone().text().then((html) => {
              // Extract hotel data from page (simplified)
              // In real app, would parse JSON from API
              console.log('Caching hotel page for offline');
            });
          }
          
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Static assets - Cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      handleBackgroundSync()
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Hotel Booking', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    event.notification.close();
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message event
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Helper function for background sync
async function handleBackgroundSync() {
  try {
    // Handle any queued requests or sync tasks
    console.log('Service Worker: Handling background sync');
    
    // Example: Sync offline bookings
    const offlineBookings = await getOfflineBookings();
    for (const booking of offlineBookings) {
      try {
        await syncBooking(booking);
      } catch (error) {
        console.error('Service Worker: Failed to sync booking:', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// Helper functions for offline functionality
async function getOfflineBookings() {
  // Get bookings stored offline
  return [];
}

async function syncBooking(booking) {
  // Sync booking with server
  return fetch('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(booking),
  });
}