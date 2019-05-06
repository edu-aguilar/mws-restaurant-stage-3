import { openDB } from 'idb';

/**
 * Common database helper functions.
 */

class DBHelper {

  constructor() {
    this._dbPromise = DBHelper.openDatabase();
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

  cacheReviews(id, reviews) {
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
        this.cacheReviews(restaurantId, reviews);
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
}

export default DBHelper;