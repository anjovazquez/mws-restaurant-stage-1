importScripts('/js/idb.js');

const RESTAURANT_PRECACHE = 'restaurant-precache-v4';

const RESTAURANT_PRECACHE_URLS = [
  '/',
  '/index.html',
  '/restaurant.html',
  'js/dbhelper.js',
  'js/main.js',
  'js/restaurant_info.js',
  'css/styles.css',
  'img/1.webp',
  'img/2.webp',
  'img/3.webp',
  'img/4.webp',
  'img/5.webp',
  'img/6.webp',
  'img/7.webp',
  'img/8.webp',
  'img/9.webp',
  'img/10.webp'
];

function createRestaurantDatabase(upgradeDB) {
  idb.open('restaurants', 1, function (upgradeDB) {
    console.log("creating restaurants database");
    upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
  })
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(RESTAURANT_PRECACHE)
      .then(cache => cache.addAll(RESTAURANT_PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});

/*
The service worker activation event is a good time to create a database. Creating a database during the activation event means that it will only be created (or opened, if it already exists) when a new service worker takes over, rather than each time the app runs (which is inefficient). It's also likely better than using the service worker's installation event, since the old service worker will still be in control at that point, and there could be conflicts if a new database is mixed with an old service worker.
*/
self.addEventListener('activate', event => {
  event.waitUntil(
    createRestaurantDatabase()
  )
});

self.addEventListener('activate', event => {
  const currentCaches = [RESTAURANT_PRECACHE];
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

function addRestaurantsToDB(storeName, items) {
  idb.open('restaurants', 1).then(function (db) {
    var tx = db.transaction(storeName, 'readwrite');
    var store = tx.objectStore(storeName);

    return Promise.all(items.map(function (item) {
      console.log("Adding Restaurant", item);
      return store.put(item);
    })
    ).then(function (e) {
      console.log("DB Restaurant Completed");
    }).catch(function (e) {
      tx.abort();
      console.log(e);
    })
  })
}

self.addEventListener('fetch', event => {

  if (!isFetchToApi(event.request.url)) {
    if (shouldBeCached(event.request)) {
      event.respondWith(fetchStaticCache(event));
    }
  }
  else {
    console.log(event.request.url);
    let storeName = 'restaurants';

    idb.open('restaurants', 1).then(function (db) {

      var tx = db.transaction(storeName, 'readonly');
      var store = tx.objectStore(storeName);

      // Return items from database
      return store.getAll();
    }).then((resultDb) => {
      //From Network
      if (resultDb.length == 0) {
        return fetch(event.request.url).then((response) => {
          return response.json().then(function (data) {
            console.log(event.request.url, 'json data', data);

            // Adds data to database
            addRestaurantsToDB(storeName, data);
            console.log('Saving to DB and responding from FETCH', data);

            const fetchResponse = new Response(JSON.stringify(data), generateOkHttp());
            return fetchResponse;
          })
        })
      }
      //From DB
      else {
        console.log('Response from DB');
        const dbResponse = new Response(JSON.stringify(resultDb), generateOkHttp());
        console.log(dbResponse);
        return dbResponse;
      }
    })
  }
});


function generateOkHttp() {
  var init = {
    status: 200,
    statusText: "OK",
    headers: { 'Content-Type': 'application/json' }
  };
  return init;
}

function fetchStaticCache(event) {
  return caches.match(event.request).then(function (response) {
    return response || fetch(event.request).then(function (response) {
      //caches.put(event.request, response.clone());
      return response;
    });
  });
}

function shouldBeCached(request) {
  return request.url.includes(self.location.origin) && request.method == "GET" && !request.url.includes("browser-sync");
}

function isFetchToApi(url) {
  return url.indexOf('restaurants') != -1;
}