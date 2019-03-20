import { openDB } from 'idb';

/**
 * Common database helper functions.
 */

export default class DBHelper {

  /**
   * API REST URL.
   */
  static get APIURL() {
    const baseURL = 'http://localhost';
    const port = '1337';
    return `${baseURL}:${port}/restaurants`;
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
      }
    });

  }

  static cacheRestaurants(restaurants) {

    this.openDatabase().then(db => {
      if (!db) return;
      const tx = db.transaction('restaurants', 'readwrite');
      restaurants.forEach(restaurant => tx.store.add(restaurant));
    });
  }

  static getCachedRestaurants() {
    return this.openDatabase().then(db => {
      if (!db) return;
      return db.getAll('restaurants');
    });
  }

  /**
   * Fetch all restaurants from API REST
   */
  static fetchRestaurants() {
    //TODO add IndexedDB here to store data when fetched. After that, fetch from indexedDB before try to fetch the API.
    return fetch(DBHelper.APIURL)
      .then(res => res.json())
      .then(formatedResponse => {
        this.cacheRestaurants(formatedResponse);
        return formatedResponse;
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    const endpoint = `${DBHelper.APIURL}/${id}`;
    return fetch(endpoint)
      .then(res => res.json())
      .then(formatedResponse => formatedResponse);
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        let results = restaurants;
        if (cuisine != 'all') {
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') {
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        return results;
      });
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
  static fetchNeighborhoods() {
    return DBHelper.fetchRestaurants()
      .then(restaurants => DBHelper.getNeighborhoods.call(this, restaurants));
  }
  
  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines() {
    return DBHelper.fetchRestaurants()
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
    return (`./img/small/${restaurant.photograph}.jpg`);
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
}
