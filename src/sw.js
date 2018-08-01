importScripts('/js/idb.js');

const RESTAURANT_PRECACHE = 'restaurant-precache-v4';
const RESTAURANT_CACHE_RUNTIME = 'runtime';

const RESTAURANT_PRECACHE_URLS = [
  '/',
  'js/dbhelper.js',
  'js/main.js',
  'js/restaurant_info.js',
  'css/styles.css'
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

function addAllToDB(storeName, items) {
  idb.open('restaurants', 1).then(function (db) {
    var tx = db.transaction(storeName, 'readwrite');
    var store = tx.objectStore(storeName);

    return Promise.all(items.map(function (item) {
      console.log("Adding Item", item);
      return store.put(item);
    })
    ).then(function (e) {
      console.log("Added Successfully");
    }).catch(function (e) {
      tx.abort();
      console.log(e);
    })
  })
}

self.addEventListener('fetch', event => {

  if (!isFetchToApi(event.request.url)) {
    event.respondWith(fetchStaticCache(event));
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
      //From DB
      if(resultDb.length==0){
        event.respondWith(fetch(event.request.url).catch((error)=>{
          console.log('Response from DB');
            const indexDBResponse = new Response(JSON.stringify(resultDb), generateOkHttp());
            console.log("Response from indexDB to send to fetch ", resultDb);
            return indexDBResponse;
        }))
      }
      //From Network
      else{
        event.respondWith(fetch(event.request.url).then((response)=>{
          return response.json().then(function(data){
            console.log(event.request.url, 'json data', data);

                // Adds data to database
                addAllToDB(storeName, data);
                console.log('Saving to DB and responding from FETCH', data);

                const fetchResponse = new Response(JSON.stringify(data), generateOkHttp());
                return fetchResponse;
          })
        }))
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
  if (event.request.url.includes(self.location.origin) && event.request.method == "GET" && !event.request.url.includes("browser-sync")) {
    event.respondWith(caches.open(RESTAURANT_CACHE_RUNTIME).then(function (cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function (response) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    }));
  }
}

function isFetchToApi(url) {
  return url.indexOf('restaurants') != -1;
}