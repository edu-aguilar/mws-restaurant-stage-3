import header from './header';
import DBHelper from './dbhelper';
import L from 'leaflet';

(function () {
  var _restaurants = [];
  var _newMap;
  var _markers = [];

  /**
   * Fetch neighborhoods and cuisines as soon as the page is loaded.
   */
  document.addEventListener('DOMContentLoaded', (event) => {
    header.setBehavior();
    DBHelper.getCachedRestaurants()
      .then(restaurants => {
        resetRestaurants(restaurants);
        fillRestaurantsHTML(restaurants);
        setFilters(restaurants);
      })
      .finally(() => {
        fetchNeighborhoods();
        fetchCuisines();
        updateRestaurants();
      });

    initMap();
  });

  /**
    * Setting filters when offline
    */
  const setFilters = (restaurants) => {
    const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
    fillNeighborhoodsHTML(neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i));

    const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
    fillCuisinesHTML(cuisines.filter((v, i) => cuisines.indexOf(v) == i));
  }

  /**
    * Set neighborhoods HTML.
    */
  const fillNeighborhoodsHTML = (neighborhoods) => {
    const select = document.getElementById('neighborhoods-select');
    while (select.hasChildNodes() && select.childNodes.length > 2) {   
      select.removeChild(select.lastChild);
    }
    neighborhoods.forEach(neighborhood => {
      const option = document.createElement('option');
      option.innerHTML = neighborhood;
      option.value = neighborhood;
      select.append(option);
    });
  }

  /**
     * Set cuisines HTML.
     */
  const fillCuisinesHTML = (cuisines) => {
    const select = document.getElementById('cuisines-select');
    while (select.hasChildNodes() && select.childNodes.length > 2) {   
      select.removeChild(select.lastChild);
    }
    cuisines.forEach(cuisine => {
      const option = document.createElement('option');
      option.innerHTML = cuisine;
      option.value = cuisine;
      select.append(option);
    });
  }

  /**
   * Fetch all neighborhoods and set their HTML.
   */
  const fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods()
      .then(fillNeighborhoodsHTML)
      .catch((error) => { console.log(error) });
  }

  /**
   * Fetch all cuisines and set their HTML.
   */
  const fetchCuisines = () => {
    DBHelper.fetchCuisines()
      .then(fillCuisinesHTML)
      .catch((error) => { console.log(error) });
  }

  /**
   * Initialize leaflet map, called from HTML.
   */
  const initMap = () => {

    _newMap = L.map('map', {
      center: [40.722216, -73.987501],
      zoom: 11,
      scrollWheelZoom: false
    });
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
      mapboxToken: 'pk.eyJ1IjoiZWR1YWd1aWxhciIsImEiOiJjanIxMTgyemQwcWEzNDRxcXN3NjFzYjVoIn0.QOGDqtbrVrsEklEL-2qbBg',
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: 'mapbox.streets'
    }).addTo(_newMap);

  }

  /**
   * Update page and map for current restaurants.
   * Global context because its fired also from index.html
   */
  window.updateRestaurants = () => {
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
      .then((restaurants = _restaurants) => {
        resetRestaurants(restaurants);
        fillRestaurantsHTML(restaurants);
        addMarkersToMap(restaurants);
      })
      .catch((error) => { console.log(error) });
  }

  /**
   * Clear current restaurants, their HTML and remove their map markers.
   */
  const resetRestaurants = (restaurants) => {
    _restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    if (_markers) {
      _markers.forEach(marker => marker.remove());
    }
    _markers = [];
    _restaurants = restaurants;
  }

  /**
   * Create all restaurants HTML and add them to the webpage.
   */
  const fillRestaurantsHTML = (restaurants) => {
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
      ul.append(createRestaurantHTML(restaurant));
    });
  }

  /**
   * Create restaurant HTML.
   */
  const createRestaurantHTML = (restaurant) => {
    const li = document.createElement('li');

    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.alt = restaurant.name;
    li.append(image);

    const restaurantDataWrapper = document.createElement('div');
    restaurantDataWrapper.className = 'restaurant-info-wrapper';
    li.append(restaurantDataWrapper);

    const name = document.createElement('h2');
    name.innerHTML = restaurant.name;
    restaurantDataWrapper.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    restaurantDataWrapper.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    restaurantDataWrapper.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);
    more.setAttribute('aria-label', `View details of ${restaurant.name} restaurant`);
    li.append(more);

    return li;
  }

  /**
   * Add markers for current restaurants to the map.
   */
  const addMarkersToMap = (restaurants) => {
    restaurants.forEach(restaurant => {
      // Add marker to the map
      const marker = DBHelper.mapMarkerForRestaurant(restaurant, _newMap);
      marker.on("click", onClick);
      function onClick() {
        window.location.href = marker.options.url;
      }
      _markers.push(marker);
    });

  }
})();
