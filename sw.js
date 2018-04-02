var cacheName = 'restaurant-cache';

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(cacheName).then(function (cache) {
            return cache.addAll([
                '/',
                'index.html',
                'restaurant.html',
                'js/dbhelper.js',
                'js/main.js',
                'js/restaurant_info.js',
                'data/restaurants.json',
                'css/styles.css',
                'css/styles800.css',
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
            ]);
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.filter(function(cacheName) {
            return cacheName.startsWith('restaurant-cache') &&
                   cacheName != this.cacheName;
          }).map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      })
    );
  });

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            console.log(event.request);
            return response || fetch(event.request);
        })
    );
});