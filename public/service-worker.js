/**
 * Service Worker
 * 
 * Provides caching strategies and offline capabilities for the application.
 * This service worker implements a workbox-like approach with custom caching strategies.
 */

// Cache Names
const STATIC_CACHE_NAME = 'static-cache-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v1';
const IMAGES_CACHE_NAME = 'images-cache-v1';
const API_CACHE_NAME = 'api-cache-v1';

// Resources to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/fonts/',
  '/assets/icons/'
];

// Maximum number of items in the dynamic cache
const DYNAMIC_CACHE_MAX_ITEMS = 100;

// API endpoints that should be cached
const API_CACHE_URLS = [
  '/api/tour-dates',
  '/api/products',
  '/api/cosmic-content'
];

// Install event: Cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  // Skip waiting to activate the new service worker immediately
  self.skipWaiting();
  
  // Cache static assets
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(error => {
        console.error('[Service Worker] Failed to cache static assets:', error);
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  // Claim clients to take control immediately
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== IMAGES_CACHE_NAME &&
              cacheName !== API_CACHE_NAME
            ) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
});

// Fetch event: Implement caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests or those that start with chrome-extension:// or devtools://
  if (
    event.request.method !== 'GET' ||
    event.request.url.startsWith('chrome-extension://') ||
    event.request.url.startsWith('devtools://')
  ) {
    return;
  }
  
  // Skip tracking requests or any other non-cacheable URLs
  if (url.pathname.includes('/analytics') || url.pathname.includes('/collect')) {
    return;
  }
  
  // API requests: Cache with network update strategy
  if (isApiRequest(event.request)) {
    event.respondWith(apiCacheStrategy(event.request));
  }
  // Image requests: Cache with fallback strategy
  else if (isImageRequest(event.request)) {
    event.respondWith(imageCacheStrategy(event.request));
  }
  // HTML requests: Network first with cache fallback strategy
  else if (isHtmlRequest(event.request)) {
    event.respondWith(htmlCacheStrategy(event.request));
  }
  // Static assets (CSS, JS, etc.): Cache first with network fallback strategy
  else if (isStaticAsset(event.request)) {
    event.respondWith(staticCacheStrategy(event.request));
  }
  // All other requests: Network first with dynamic cache
  else {
    event.respondWith(networkFirstWithDynamicCache(event.request));
  }
});

// Message event: Handle messages from the client
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Clear cache on demand
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys()
        .then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        })
        .then(() => {
          console.log('[Service Worker] All caches cleared');
          // Notify clients that caches have been cleared
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'CACHES_CLEARED'
              });
            });
          });
        })
    );
  }
  
  // Clear specific cache
  if (event.data && event.data.type === 'CLEAR_CACHE' && event.data.cacheName) {
    event.waitUntil(
      caches.delete(event.data.cacheName)
        .then(success => {
          console.log(`[Service Worker] Cache ${event.data.cacheName} cleared:`, success);
          // Notify clients that cache has been cleared
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'CACHE_CLEARED',
                cacheName: event.data.cacheName,
                success
              });
            });
          });
        })
    );
  }
});

// Push event: Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New notification',
      icon: data.icon || '/assets/icons/icon-192x192.png',
      badge: data.badge || '/assets/icons/badge-72x72.png',
      data: data.data || {},
      vibrate: data.vibrate || [100, 50, 100],
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Notification', options)
    );
  } catch (error) {
    console.error('[Service Worker] Failed to handle push notification:', error);
  }
});

// Notification click event: Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Get notification data
  const data = event.notification.data || {};
  const url = data.url || '/';
  
  // Focus existing window or open a new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Focus existing window
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// Background sync event: Handle background syncs
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  // Handle different sync tags
  if (event.tag === 'sync-newsletter') {
    event.waitUntil(syncNewsletter());
  } else if (event.tag === 'sync-content') {
    event.waitUntil(syncContent());
  }
});

/**
 * Checks if a request is for an API endpoint
 * @param {Request} request The request to check
 * @returns {boolean} True if the request is for an API endpoint
 */
function isApiRequest(request) {
  const url = new URL(request.url);
  
  // Check if the URL path starts with /api
  if (url.pathname.startsWith('/api')) {
    return true;
  }
  
  // Check if the URL is in the list of API cache URLs
  return API_CACHE_URLS.some(apiUrl => url.pathname.includes(apiUrl));
}

/**
 * Checks if a request is for an image
 * @param {Request} request The request to check
 * @returns {boolean} True if the request is for an image
 */
function isImageRequest(request) {
  const url = new URL(request.url);
  const extension = url.pathname.split('.').pop().toLowerCase();
  
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif'].includes(extension);
}

/**
 * Checks if a request is for an HTML document
 * @param {Request} request The request to check
 * @returns {boolean} True if the request is for an HTML document
 */
function isHtmlRequest(request) {
  const url = new URL(request.url);
  const extension = url.pathname.split('.').pop().toLowerCase();
  
  // If no extension (e.g., '/about'), it's likely an HTML document
  if (!extension || extension === url.pathname) {
    return true;
  }
  
  return extension === 'html';
}

/**
 * Checks if a request is for a static asset
 * @param {Request} request The request to check
 * @returns {boolean} True if the request is for a static asset
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  const extension = url.pathname.split('.').pop().toLowerCase();
  
  return [
    'css', 'js', 'mjs', 'woff', 'woff2', 'ttf', 'eot', 
    'json', 'xml', 'ico', 'map'
  ].includes(extension);
}

/**
 * API cache strategy: Stale-while-revalidate
 * Returns cached response immediately if available, then updates cache in the background
 * @param {Request} request The request to handle
 * @returns {Promise<Response>} The response
 */
async function apiCacheStrategy(request) {
  // Clone the request as it can only be used once
  const fetchRequest = request.clone();
  
  try {
    // Try to get the cached response
    const cachedResponse = await caches.match(request);
    
    // Start fetching from network
    const networkResponsePromise = fetch(fetchRequest).then(async response => {
      const responseToCache = response.clone();
      
      // If response is valid, cache it
      if (response && response.status === 200) {
        const cache = await caches.open(API_CACHE_NAME);
        await cache.put(request, responseToCache);
      }
      
      return response;
    }).catch(error => {
      console.error('[Service Worker] API fetch failed:', error);
      // Return offline response or null
      return createOfflineResponse('API request failed');
    });
    
    // Return cached response if available, otherwise wait for network
    return cachedResponse || networkResponsePromise;
  } catch (error) {
    console.error('[Service Worker] API cache strategy error:', error);
    
    // Try network as fallback
    try {
      const networkResponse = await fetch(fetchRequest);
      return networkResponse;
    } catch (netError) {
      return createOfflineResponse('API request failed');
    }
  }
}

/**
 * Image cache strategy: Cache first with network fallback and fallback image
 * @param {Request} request The request to handle
 * @returns {Promise<Response>} The response
 */
async function imageCacheStrategy(request) {
  try {
    // Try to get the cached response
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not cached, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache the network response
    const cache = await caches.open(IMAGES_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Image fetch failed:', error);
    
    // Return fallback image
    try {
      return await caches.match('/assets/images/fallback-image.png');
    } catch (fallbackError) {
      // If fallback image is not cached, return empty image
      return createOfflineImageResponse();
    }
  }
}

/**
 * HTML cache strategy: Network first with cache fallback
 * @param {Request} request The request to handle
 * @returns {Promise<Response>} The response
 */
async function htmlCacheStrategy(request) {
  try {
    // Attempt to fetch from network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] HTML fetch failed, falling back to cache:', error);
    
    // Try to get from cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, try to serve offline HTML
    return caches.match('/offline.html')
      .then(offlineResponse => {
        return offlineResponse || createOfflineResponse('Service Unavailable');
      });
  }
}

/**
 * Static cache strategy: Cache first with network fallback
 * @param {Request} request The request to handle
 * @returns {Promise<Response>} The response
 */
async function staticCacheStrategy(request) {
  try {
    // Try to get the cached response
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not cached, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache the network response
    const cache = await caches.open(STATIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Static asset fetch failed:', error);
    return createOfflineResponse('Resource unavailable');
  }
}

/**
 * Network first with dynamic cache strategy
 * @param {Request} request The request to handle
 * @returns {Promise<Response>} The response
 */
async function networkFirstWithDynamicCache(request) {
  try {
    // Attempt to fetch from network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      
      // Limit the size of the dynamic cache
      await limitCacheSize(DYNAMIC_CACHE_NAME, DYNAMIC_CACHE_MAX_ITEMS);
      
      // Cache the network response
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Try to get from cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, return offline response
    console.error('[Service Worker] Network and cache fetch failed:', error);
    return createOfflineResponse('Resource unavailable');
  }
}

/**
 * Limits the size of a cache
 * @param {string} cacheName The name of the cache to limit
 * @param {number} maxItems The maximum number of items to keep in the cache
 */
async function limitCacheSize(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxItems) {
      // Delete the oldest items
      const itemsToDelete = keys.length - maxItems;
      
      for (let i = 0; i < itemsToDelete; i++) {
        await cache.delete(keys[i]);
      }
      
      console.log(`[Service Worker] Removed ${itemsToDelete} items from ${cacheName}`);
    }
  } catch (error) {
    console.error('[Service Worker] Failed to limit cache size:', error);
  }
}

/**
 * Creates a simple offline response
 * @param {string} message The message to include in the response
 * @returns {Response} The offline response
 */
function createOfflineResponse(message = 'You are offline') {
  return new Response(
    `<html>
      <head>
        <title>Offline</title>
        <style>
          body {
            font-family: sans-serif;
            text-align: center;
            padding: 20px;
            color: #333;
          }
          h1 {
            color: #444;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>You're Offline</h1>
          <p>${message}</p>
          <p>Please check your internet connection and try again.</p>
        </div>
      </body>
    </html>`,
    {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      },
      status: 503,
      statusText: 'Service Unavailable'
    }
  );
}

/**
 * Creates an offline image response (transparent 1x1 pixel)
 * @returns {Response} The offline image response
 */
function createOfflineImageResponse() {
  // Base64 encoded transparent 1x1 pixel PNG
  const TRANSPARENT_PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const byteString = atob(TRANSPARENT_PIXEL);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  
  const blob = new Blob([uint8Array], { type: 'image/png' });
  return new Response(blob, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * Sync newsletter subscriptions
 * @returns {Promise<void>}
 */
async function syncNewsletter() {
  try {
    // Get pending newsletter subscriptions from IndexedDB
    const db = await openDatabase();
    const pendingSubscriptions = await getAllPendingSubscriptions(db);
    
    if (pendingSubscriptions.length === 0) {
      return;
    }
    
    // Try to sync each subscription
    for (const subscription of pendingSubscriptions) {
      try {
        const response = await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscription)
        });
        
        if (response.ok) {
          await removePendingSubscription(db, subscription.id);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync subscription:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Failed to sync newsletter:', error);
  }
}

/**
 * Sync content updates
 * @returns {Promise<void>}
 */
async function syncContent() {
  try {
    // Implementation of content sync
    console.log('[Service Worker] Syncing content...');
    // Actual implementation would go here
  } catch (error) {
    console.error('[Service Worker] Failed to sync content:', error);
  }
}

/**
 * Opens the IndexedDB database
 * @returns {Promise<IDBDatabase>} The database
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('offlineData', 1);
    
    request.onerror = event => {
      reject(new Error('Failed to open database'));
    };
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Create pending-subscriptions object store
      if (!db.objectStoreNames.contains('pending-subscriptions')) {
        const store = db.createObjectStore('pending-subscriptions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('email', 'email', { unique: false });
      }
    };
  });
}

/**
 * Gets all pending newsletter subscriptions
 * @param {IDBDatabase} db The database
 * @returns {Promise<Array>} The pending subscriptions
 */
function getAllPendingSubscriptions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-subscriptions'], 'readonly');
    const store = transaction.objectStore('pending-subscriptions');
    const request = store.getAll();
    
    request.onerror = event => {
      reject(new Error('Failed to get pending subscriptions'));
    };
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
  });
}

/**
 * Removes a pending subscription from the database
 * @param {IDBDatabase} db The database
 * @param {number} id The subscription ID
 * @returns {Promise<void>}
 */
function removePendingSubscription(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-subscriptions'], 'readwrite');
    const store = transaction.objectStore('pending-subscriptions');
    const request = store.delete(id);
    
    request.onerror = event => {
      reject(new Error('Failed to remove pending subscription'));
    };
    
    request.onsuccess = event => {
      resolve();
    };
  });
}