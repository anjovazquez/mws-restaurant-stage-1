importScripts('/js/idb.js.gz');

const RESTAURANT_PRECACHE = 'restaurant-precache-v4';

const RESTAURANT_PRECACHE_URLS = [
  '/',
  '/index.html',
  '/restaurant.html',
  //'js/dbhelper.js',
  'js/main.js.gz',
  'js/idb.js.gz',
  'js/rest.js.gz',
  //'js/restaurant_info.js',
  'css/styles.css.gz',
  'img/1.webp',
  'img/2.webp',
  'img/3.webp',
  'img/4.webp',
  'img/5.webp',
  'img/6.webp',
  'img/7.webp',
  'img/8.webp',
  'img/9.webp',
  'img/10.webp',
  'img/empty.webp'
];

function createRestaurantDatabase(upgradeDB) {
  idb.open('restaurants', 1, function (upgradeDB) {
    /*switch(upgradeDB.oldVersion) {
      case 0: 
        upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
        console.log("creating restaurants database");
      case 1:
        const reviews = upgradeDB.createObjectStore('reviews', { keyPath: 'id'});
        reviews.createIndex('restaurant', 'restaurantId');
        console.log("creating reviews database");
  }*/

    upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
    const reviews = upgradeDB.createObjectStore('reviews', { keyPath: 'id' });
    reviews.createIndex('restaurant', 'restaurantId');
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

function addReviewsToDB(storeName, items) {
  idb.open('restaurants', 1).then(function (db) {
    var tx = db.transaction(storeName, 'readwrite');
    var store = tx.objectStore(storeName);

    return Promise.all(items.map(function (item) {
      console.log("Adding Review", item);
      return store.put(item);
    })
    ).then(function (e) {
      console.log("DB Review Completed");
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

    if (isFetchRestaurants(event.request.url)) {
      console.log(event.request.url);
      let storeName = 'restaurants';
      event.respondWith(
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
        }));
    }
    else {
      event.respondWith(
        //if (isFetchReviews(event.request.url)) {
        idb.open('restaurants', 1).then(function (db) {
          var tx = db.transaction('reviews', 'readonly');
          var store = tx.objectStore('reviews');
          return store.getAll();
        }).then((reviews) => {

          let url = new URL(event.request.url);
          let restIdFilter = url.searchParams.get("restaurant_id");
          const reviewsByRest = reviews.filter(review => review.restaurantId === restIdFilter || review.restaurantId === parseInt(restIdFilter));

          //From Network
          if (reviewsByRest.length == 0) {
            return fetch(event.request.url).then((response) => {
              return response.json().then(function (data) {
                console.log(event.request.url, 'json data', data);

                // Adds data to database
                addReviewsToDB('reviews', data);
                console.log('Saving to DB and responding from FETCH', data);

                const fetchResponse = new Response(JSON.stringify(data), generateOkHttp());
                return fetchResponse;
              })
            })
          }
          //From DB
          else {           
            console.log('Response from DB');
            const dbResponse = new Response(JSON.stringify(reviewsByRest), generateOkHttp());
            console.log(dbResponse);
            return dbResponse;
          }
        }));
    }
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
  return caches.match(event.request, { ignoreSearch: true }).then(function (response) {
    return response || fetch(event.request).then(function (response) {
      //caches.put(event.request, response.clone());
      return response;
    });
  });
}

function shouldBeCached(request) {
  return request.method == "GET" && !request.url.includes("browser-sync");
}

function isFetchToApi(url) {
  return isFetchRestaurants(url) || isFetchReviews(url);
}

function isFetchReviews(url) {
  return url.indexOf('reviews') != -1;
}

function isFetchRestaurants(url) {
  return url.indexOf('restaurants') != -1;
}

self.addEventListener('sync', function (event) {
  if (event.tag === 'pending_review') {
    event.waitUntil(sendPendingReviews().then(function () {
      console.log('Review synchronized');
    }).catch(function (error) {
      console.log('Error in review synchronization', error);
    }));
  }
  else {
    if (event.tag === 'pending_favourite') {
      event.waitUntil(sendPendingFavourites().then(function () {
        console.log('Favourite synchronized');
      }).catch(function (error) {
        console.log('Error in favourite synchronization', error);
      }));
    }
  }
});

function sendPendingFavourites() {
  console.log();
  return idb.open('pending_favourite', 1).then((database) => {
    var transaction = database.transaction('pending_favourite', 'readonly');
    return transaction.objectStore('pending_favourite').getAll();
  }).then((favourites) => {
    return Promise.all(favourites.map((favourite) => {
      let favId = favourite.id;
      let restaurantId = favourite.restaurantId;
      let fav = favourite.favourite;

      return fetch('http://localhost:1337/restaurants/' + restaurantId + '/?is_favorite=' + fav, {
        method: 'PUT',
        headers: new Headers(),
        mode: 'cors',
        cache: 'default'
      }).then(response => {
        if (response.status === 200) {
          idb.open('pending_favourite', 1)
            .then((database) => {
              var transaction = database.transaction('pending_favourite', 'readwrite');
              return transaction.objectStore('pending_favourite').delete(favId);
            });
        }
      }).catch(error => console.log(error));
    }));
  });

}

function sendPendingReviews() {
  //Query pendingreviews in local database
  return idb.open('pending_review', 1).then((database) => {
    var transaction = database.transaction('pending_review', 'readonly');
    return transaction.objectStore('pending_review').getAll();
  }).then((reviews) => {
    return Promise.all(reviews.map((review) => {

      let reviewId = review.id;

      //Send pending reviews
      return fetch('http://localhost:1337/reviews', {
        method: 'POST',
        body: JSON.stringify(review),
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      }).then((response) => {
        return response.json();
      }).then((responseData) => {
        console.log("Syncronized data" + responseData);

        //Delete local database
        if (responseData) {
          idb.open('pending_review', 1)
            .then((database) => {
              var transaction = database.transaction('pending_review', 'readwrite');
              return transaction.objectStore('pending_review').delete(reviewId);
            });
        }
      })
    }));
  });




}