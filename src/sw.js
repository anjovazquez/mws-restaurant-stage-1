importScripts('/js/idb.js');

function createRestaurantDatabase(upgradeDB) {
  idb.open('restaurants', 1, function (upgradeDB) {
    console.log("creating restaurants database");
    upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
    for (var i = 1; i <= 10; i++) {
      upgradeDB.createObjectStore('reviews-' + i, { keyPath: 'id' });
    }
  })
}

self.addEventListener('activate', event => {
  event.waitUntil(
    createRestaurantDatabase()
  )
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(async function () {
    return fetch(event.request.url);
  });
    
  event.respondWith(function () {
    return idb.open('restaurants', 1)
      .then(function (db) {

        var tx = db.transaction(storeName, 'readonly');
        var store = tx.objectStore(storeName);

        // Return items from database
        return store.getAll();
      }).then(result => {
        console.log("All Data From IndexDB", rs);

        if(!rs.length){
          console.log('Attempting to fetch from network ', event.request.url);
          return fetch(event.request.url)
            .then((response)=> {
              console.log(event.request.url, 'json data', data);
            });
        }
      });
  });
});


