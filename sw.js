const filesToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/data/restaurants.json',
  '/js/common.js',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js'
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

self.addEventListener('activate', function(event) {

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
