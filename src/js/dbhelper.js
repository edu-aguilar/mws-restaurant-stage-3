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

  /**
   * Fetch all restaurants from API REST
   */
  static fetchRestaurants() {
    //TODO add IndexedDB here to store data when fetched. After that, fetch from indexedDB before try to fetch the API.
    return fetch(DBHelper.APIURL)
      .then(res => res.json())
      .then(formatedResponse => formatedResponse);
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    //TODO add IndexedDB here to store data when fetched. After that, fetch from indexedDB before try to fetch the API.
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

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        return neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
      });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines() {
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        return cuisines.filter((v, i) => cuisines.indexOf(v) == i)
      });
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
