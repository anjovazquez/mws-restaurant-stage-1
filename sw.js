const RESTAURANT_PRECACHE = 'restaurant-precache-v2';
const RESTAURANT_CACHE_RUNTIME = 'runtime';

// A list of local resources we always want to be cached.
const RESTAURANT_PRECACHE_URLS = [    
        '/',
        'index.html',
        'restaurant.html',
        'js/dbhelper.js',
        'js/main.js',
        'js/restaurant_info.js',
        'data/restaurants.json',
        'css/styles.css',
        'img/1.jpg',
        'img/2.jpg',
        'img/3.jpg',
        'img/4.jpg',
        'img/5.jpg',
        'img/6.jpg',
        'img/7.jpg',
        'img/8.jpg',
        'img/9.jpg',
        'img/10.jpg'
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(RESTAURANT_PRECACHE)
      .then(cache => cache.addAll(RESTAURANT_PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});


self.addEventListener('activate', event => {
  const currentCaches = [RESTAURANT_PRECACHE, RESTAURANT_CACHE_RUNTIME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return caches.open(RESTAURANT_CACHE_RUNTIME).then(cache => {
          return fetch(event.request).then(response => {
              
            return cache.put(event.request, response.clone()).then(() => {
              return response;
            });
          });
        });
      })
    );
  }
});