let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    option.setAttribute("role", "option");
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    option.setAttribute("role", "option");
    select.append(option);
  });
}

initMap = () => {
  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoiYW5qb3ZhenF1ZXoiLCJhIjoiY2o2dHcza2Y0MHduYTJxcXN6NHAzbDZpZCJ9.jj-yFqjE7Ru3YVtIcdcgXw',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);
  updateRestaurants();
}

/**
 * Initialize Google map, called from HTML.
 */
/*window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}*/

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();

  var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));

  if ("IntersectionObserver" in window) {
    let lazyImageObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.srcset = lazyImage.dataset.srcset;
          lazyImage.classList.remove("lazy");
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(function (lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  } else {
    // Possibly fall back to a more compatible method here
  }
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const restaurantCardImg = document.createElement('div');
  restaurantCardImg.class = 'restaurant-card-img';

  const image = document.createElement('img');
  image.className = 'restaurant-img lazy';
  //image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.src = "/img/empty.webp";
  image.dataset.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.dataset.srcset = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = restaurant.photograph_alt;
  restaurantCardImg.append(image);
  li.append(restaurantCardImg);

  const restaurantCardBody = document.createElement('div');
  restaurantCardBody.className = 'restaurant-card-body';

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  restaurantCardBody.append(name);

  const favourite = document.createElement('label');
  favourite.innerHTML = '❤';
  console.log(JSON.stringify({rest : restaurant.id, fav : restaurant.is_favorite}));
  if(restaurant.is_favorite === 'true' || restaurant.is_favorite === true){
    favourite.className = 'fav_yes';
  }
  else{    
    favourite.className = 'fav_no';
  }
  favourite.setAttribute('data-id', restaurant.id);
  restaurantCardBody.append(favourite);

  favourite.addEventListener('click', (e) => {   

    if (e.target.className === 'fav_no') {
      e.target.className = 'fav_yes';
    }
    else {
      e.target.className = 'fav_no';
    }

    navigator.serviceWorker.ready.then(function (registration) {
      
      
      let pending_favourite = { 
        favourite: e.target.className === 'fav_yes',
        restaurantId : e.target.getAttribute('data-id') };

      console.log(JSON.stringify(pending_favourite));  
      idb.open('pending_favourite', 1, function (upgradeDb) {
        upgradeDb.createObjectStore('pending_favourite', { autoIncrement: true, keyPath: 'id' });
      }).then((database) => {
        var trans = database.transaction('pending_favourite', 'readwrite');
        return trans.objectStore('pending_favourite').put(pending_favourite);
      }).then(() => {
        if (!navigator.onLine) {
          window.addEventListener('online', (event) => {
            console.log('Online again');
            registration.sync.register('pending_favourite').then(function () {
              console.log('Synchronization registered' + pending_favourite);
            });
          });
          return;
        }
        else {
          return registration.sync.register('pending_favourite').then(function () {
            console.log('Synchronization registered' + pending_favourite);
          });
        }
      });
      console.log(JSON.stringify(pending_favourite));
      idb.open('restaurants', 1).then(function (db) {
        var tx = db.transaction('restaurants', 'readonly');
        var store = tx.objectStore('restaurants');
        // Return items from database
        return store.get(parseInt(pending_favourite.restaurantId));
      }).then((rest) => {
        rest.is_favorite=pending_favourite.favourite;
        let restId = rest.id;
        idb.open('restaurants', 1).then(function (db) {
          var tx = db.transaction('restaurants', 'readwrite');
          var store = tx.objectStore('restaurants');
          return store.put(rest);
        });
      });


    });
  });


  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  restaurantCardBody.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  restaurantCardBody.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', 'View Details for ' + restaurant.name);
  restaurantCardBody.append(more);

  li.append(restaurantCardBody);

  return li;
}

addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
  });
}

/**
 * Add markers for current restaurants to the map.
 */
/*addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}*/
