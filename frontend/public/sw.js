// Selah PWA Service Worker - Offline Support

const CACHE_NAME = 'selah-v2.0';
const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Skip non-GET requests and Supabase API calls
    if (event.request.method !== 'GET' || 
        event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                // Return cached version or fetch from network
                const fetchPromise = fetch(event.request)
                    .then(response => {
                        // Cache the new response
                        if (response.ok) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, clone));
                        }
                        return response;
                    })
                    .catch(() => cached); // If network fails, use cached

                return cached || fetchPromise;
            })
    );
});

// Handle background sync
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncPendingData());
    }
});

async function syncPendingData() {
    // This will be triggered when connection is restored
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({ type: 'SYNC_REQUIRED' });
    });
}

// Listen for messages from main app
self.addEventListener('message', event => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
