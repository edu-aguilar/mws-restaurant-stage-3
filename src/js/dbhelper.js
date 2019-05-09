import { openDB } from 'idb';

/**
 * Common database helper functions.
 */

class DBHelper {

  constructor() {
    this._dbPromise = DBHelper.openDatabase();
    this.connectionUp();
    window.addEventListener('online', this.connectionUp.bind(this));
    window.addEventListener('offline', this.handleOffline);
  }

  handleOffline() {
    //known ios bug!!! https://developer.mozilla.org/es/docs/Web/Accessibility/ARIA/ARIA_Live_Regions#Preferring_Specialized_Live_Region_Roles
    let connectionAlert = document.querySelector('#connectionAlert');
    connectionAlert.setAttribute("role", "alert");
    connectionAlert.setAttribute("aria-live", "assertive");
    connectionAlert.classList.toggle('active');
    connectionAlert.focus();

    setTimeout(() => {
      connectionAlert.classList.toggle('active');
    }, 6000);
  }

  /**
   * API REST URL.
   */
  static APIURL(collection = 'restaurants') {
    const baseURL = 'http://localhost';
    const port = '1337';
    const endpoints = {
      restaurants: '/restaurants',
      reviews: '/reviews'
    }
    return `${baseURL}:${port}${endpoints[collection]}`;
  }

  static openDatabase() {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return openDB('restaurantsDB', 1, {
      upgrade(db) {
        db.createObjectStore('restaurants', {
          keyPath: 'id',
        });
        db.createObjectStore('reviews', {
          keyPath: 'id',
        }).createIndex('restaurant_id', 'restaurant_id', {unique: false});
        db.createObjectStore('pendingRequests', {
          keyPath: 'id',
          autoIncrement: true
        });
      }
    });

  }

  cacheRestaurants(restaurants) {

    this._dbPromise.then(db => {
      if (!db) return;
      const tx = db.transaction('restaurants', 'readwrite');
      restaurants.forEach(restaurant => tx.store.put(restaurant));
    });
  }

  cacheReviews(reviews) {
    this._dbPromise.then(db => {
      if (!db) return;
      const tx = db.transaction('reviews', 'readwrite');
      reviews.forEach(review => tx.store.put(review));
    });
  }

  /**
   * Fetch all restaurants from IDB if there are results, else go to network.
   */
  fetchRestaurants() {

    return new Promise((resolve, reject) => {
      this._dbPromise.then(db => {
        db.count('restaurants').then(number => {
          if (number > 0) {
            resolve(db.getAll('restaurants'));
          } else {
            resolve(this.fetchRestaurantsFromAPI())
          }
        }).catch(reject);
      }).catch(reject);
    });
  }

  /**
 * Fetch all restaurants from API REST
 */
  fetchRestaurantsFromAPI() {
    return fetch(DBHelper.APIURL())
      .then(response => response.json())
      .then(restaurants => {
        this.cacheRestaurants(restaurants);
        return restaurants;
      })
  }

  fetchRestaurantsByIdFromAPI(id) {
    return fetch(`${DBHelper.APIURL()}/${id}`)
      .then(response => response.json())
      .then(restaurant => {
        this.cacheRestaurants([restaurant]);
        return restaurant;
      })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  fetchRestaurantById(id) {
    return new Promise((resolve, reject) => {
      this._dbPromise.then(db => {
        db.get('restaurants', parseInt(id))
          .then(restaurant => {
            if (restaurant) {
              resolve(restaurant);
            } else {
              resolve(this.fetchRestaurantsByIdFromAPI(id));
            }
          })
          .catch(reject);
      });
    });
  }

  static filterRestaurantByCuisineAndNeighborhood(restaurants, cuisine, neighborhood) {
    let results = restaurants;
    if (cuisine != 'all') {
      results = results.filter(r => r.cuisine_type == cuisine);
    }
    if (neighborhood != 'all') {
      results = results.filter(r => r.neighborhood == neighborhood);
    }
    return results;
  }
  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    return this.fetchRestaurants()
      .then(restaurants => DBHelper.filterRestaurantByCuisineAndNeighborhood.call(this, restaurants, cuisine, neighborhood));
  }

  static getNeighborhoods(restaurants) {
    const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
    return neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
  }

  static getCuisines(restaurants) {
    const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
    return cuisines.filter((v, i) => cuisines.indexOf(v) == i)
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  fetchNeighborhoods() {
    return this.fetchRestaurants()
      .then(restaurants => DBHelper.getNeighborhoods.call(this, restaurants));
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  fetchCuisines() {
    return this.fetchRestaurants()
      .then(restaurants => DBHelper.getCuisines.call(this, restaurants));
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`./img/small/${restaurant.photograph || restaurant.id || 'default-restaurant'}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    var customIcon = L.icon({
      iconUrl: '../img/marker-icon.png',
      shadowUrl: '../img/marker-shadow.png',
    });
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {
        icon: customIcon,
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant),
      })
    marker.addTo(map);
    return marker;
  }


  /**
   * Fetch all reviews available of given restaurant from API
   */
  fetchReviewsByRestaurantIdFromAPI(restaurantId) {
    return fetch(`${DBHelper.APIURL('reviews')}/?restaurant_id=${restaurantId}`)
      .then(response => response.json())
      .then(reviews => {
        this.cacheReviews(reviews);
        return reviews;
      })
  }

  /**
   * Fetch all reviews available of given restaurant
   */
  fetchReviewsByRestaurantId(restaurantId) {

    return new Promise((resolve, reject) => {
      this._dbPromise.then(db => {
        db.transaction('reviews').objectStore('reviews')
          .index('restaurant_id').getAll(restaurantId).then((reviews) => {
          if (reviews.length > 0) {
            resolve(reviews);
          } else {
            //fetch from API && cache results.
            resolve(this.fetchReviewsByRestaurantIdFromAPI(restaurantId));
          }
        })
      }).catch(reject);
    });
  }

  updateCachedRestaurant(restaurant) {
    this._dbPromise.then(db => {
      if (!db) return;
      const objectStore = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
      var objectStoreIdRequest = objectStore.get(restaurant.id);
      objectStoreIdRequest.then(response => {
        objectStore.put(restaurant);
      });
    });
  }

  updateRestaurant(restaurant) {
    const endpoint = `${DBHelper.APIURL('restaurants')}/${restaurant.restaurantId}/?is_favorite=${restaurant.isFavorite}`;
    const httpMethod = 'PUT';
    return fetch(endpoint, {method: httpMethod})
      .then(response => response.json())
      .then(updatedRestaurant => {
        this.updateCachedRestaurant(updatedRestaurant);
        return updatedRestaurant;
      })
      .catch(() => {
        this.createPendingRequest({
          body: restaurant,
          type: 'updateFavoriteRestaurant'
        });
      });
  }

  createPendingRequest(request) {
    this._dbPromise.then(db => {
      if (!db) return;
      const tx = db.transaction('pendingRequests', 'readwrite');
      tx.store.put(request);
    });
  }

  connectionUp() {
    var _this = this;
    
    this._dbPromise.then(db => {
      db.transaction('pendingRequests', 'readwrite').store.openCursor()
        .then(function iterate(cursor) {
          if (!cursor) return;
          firePendingRequest.call(_this, cursor.value);
          cursor.delete();
          return cursor.continue().then(iterate);
        });
    })

    function firePendingRequest(request) {
      if (request.type === 'updateFavoriteRestaurant') {
        this.updateRestaurant(request.body).then(() => {
          let starEl = document.querySelector(`div[data-restaurant-id="${request.body.restaurantId}"]`);
          starEl.setAttribute('aria-pressed', request.body.isFavorite);
          starEl.classList.value = `toggle-favorite ${request.body.isFavorite ? 'favorite' : ''}`;
        })
      }
      if (request.type === 'addRestaurantReview') {
        this.addRestaurantReview(request.body).then((createdReview) => {
          //update DOM if we are in the current restaurant detail
          let searchParams = new URLSearchParams(location.search);
          let currentRestaurantId = searchParams.get('id');
          if (currentRestaurantId == createdReview.restaurant_id) {
            window._fillReviewsHTML([createdReview]);
          }
        })
      }
    }

  }

  addRestaurantReview(review) {
    const endpoint = `${DBHelper.APIURL('reviews')}`;
    const httpMethod = 'POST';
    return fetch(endpoint, {method: httpMethod, body: JSON.stringify(review)})
      .catch(persistRequest.bind(this))
      .then(response => response.json())
      .then(newReview => {
        this.cacheReviews([newReview]);
        return newReview;
      });

    function persistRequest() {
      this.createPendingRequest({
        body: review,
        type: 'addRestaurantReview'
      });
    }
  }

}

export default DBHelper;