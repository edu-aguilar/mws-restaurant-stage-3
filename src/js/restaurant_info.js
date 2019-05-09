import header from './header';
import DBHelper from './dbhelper';
import L from 'leaflet';

(function(){

var _restaurant;
var _newMap;
var dbHelper;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  dbHelper = new DBHelper();
  
  header.setBehavior();
  setNewReviewForm();

  fetchRestaurantFromURL()
    .then((restaurant = _restaurant) => {
      _restaurant = restaurant;
      initMap(restaurant, _newMap);
      fillRestaurantHTML(restaurant);
      fillBreadcrumb(restaurant);
      fetchRestaurantReviews(restaurant.id).then((reviews) => {
        fillReviewsHTML(reviews);
      });
    })
    .catch(error => {console.log(error);});
});

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = () => {
  return new Promise((resolve, reject) => {

    if (_restaurant) { // restaurant already fetched!
      resolve(_restaurant);
    }

    const id = getParameterByName('id');
    if (!id) { // no id found in URL
      reject('No restaurant id in URL');
    } else {
      dbHelper.fetchRestaurantById(id)
        .then((restaurant) => {
          resolve(restaurant);
        })
        .catch(error => {reject(error);})
    }

  });
}

const fetchRestaurantReviews = (restaurantId) => {
  return new Promise((resolve, reject) => {
    dbHelper.fetchReviewsByRestaurantId(restaurantId)
    .then((reviews) => {
      resolve(reviews);
    })
    .catch(error => {reject(error);})
  });
}

/**
 * Initialize leaflet map
 */
const initMap = (restaurant, newMap) => {

  newMap = L.map('map', {
    center: [restaurant.latlng.lat, restaurant.latlng.lng],
    zoom: 15,
    scrollWheelZoom: false
  });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoiZWR1YWd1aWxhciIsImEiOiJjanIxMTgyemQwcWEzNDRxcXN3NjFzYjVoIn0.QOGDqtbrVrsEklEL-2qbBg',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'    
  }).addTo(newMap);
  DBHelper.mapMarkerForRestaurant(restaurant, newMap);
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.setAttribute('aria-label', `Located in ${restaurant.address}`);
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.alt = restaurant.name;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML(restaurant.operating_hours);
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.tabIndex = 0;

  let personReviewInfo = document.createElement('div');
  personReviewInfo.classList = "from";
  li.appendChild(personReviewInfo);

  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.classList = "person-name";
  personReviewInfo.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.updatedAt).toDateString();
  personReviewInfo.appendChild(date);

  let reviewContent = document.createElement('div');
  reviewContent.classList = "review-data";
  li.appendChild(reviewContent);

  const rating = document.createElement('p');
  rating.classList = "rating";
  rating.innerHTML = `Rating: ${review.rating}`;
  reviewContent.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.classList = "comments";
  reviewContent.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const setNewReviewForm = () => {

  document.querySelector('#new-review').addEventListener('click', addReview);
  document.querySelector('#review-username').addEventListener('keyup', checkButtonStatus);
  document.querySelector('#review-comments').addEventListener('keyup', checkButtonStatus);

  function checkButtonStatus(e) {
    let username = document.querySelector('#review-username').value;
    let comments = document.querySelector('#review-comments').value;
    document.querySelector('#new-review').disabled = username.trim().length === 0 || comments.trim().length === 0;
  }

  function addReview(e) {
    e.preventDefault();
    let newReview = {
      restaurant_id: _restaurant.id,
      name: document.querySelector('#review-username').value,
      rating: document.querySelector('#review-rating').value,
      comments: document.querySelector('#review-comments').value
    }
    dbHelper
      .addRestaurantReview(newReview)
      .then(newReview => {
        fillReviewsHTML([newReview]);
      });
  }
}

})();
