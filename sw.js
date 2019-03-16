const filesToCache = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/css/styles.css',
  '/js/common.js',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/img/small/1.jpg',
  '/img/small/2.jpg',
  '/img/small/3.jpg',
  '/img/small/4.jpg',
  '/img/small/5.jpg',
  '/img/small/6.jpg',
  '/img/small/7.jpg',
  '/img/small/8.jpg',
  '/img/small/9.jpg',
  '/img/small/10.jpg'
];

const CACHE_NAME = 'cache-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(filesToCache))
  );
});

self.addEventListener ('fetch', event => {

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
  
        var fetchRequest = event.request.clone();
  
        return fetch(fetchRequest).then(response => {
          if(!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          var responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => { cache.put(event.request, responseToCache)});

          return response;
        });
      })
    );

});

self.addEventListener('activate', event => {

  var cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );

});
