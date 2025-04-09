const CACHE_NAME = "offline-v1";
const OFFLINE_URL = "offline.html";

self.addEventListener("install", function(event) {
  event.waitUntil(preLoad());
});

var preLoad = function() {
  console.log("Installing web app");
  return caches.open(CACHE_NAME).then(function(cache) {
    console.log("caching index and important routes");
    return cache.addAll([OFFLINE_URL]);
  });
};

self.addEventListener("fetch", function(event) {
  event.respondWith(
    checkResponse(event.request).catch(function() {
      return returnFromCache(event.request);
    })
  );

  event.waitUntil(
    addToCache(event.request)
  );
});

var checkResponse = function(request) {
  return fetch(request).then(function(response) {
    if (response.status === 404) {
      return caches.match(OFFLINE_URL);
    }
    return response;
  }).catch(function(error) {
    console.error('Fetch failed; returning offline page instead.', error);
    return caches.match(OFFLINE_URL);
  });
};

var returnFromCache = function(request) {
  return caches.open(CACHE_NAME).then(function(cache) {
    return cache.match(request).then(function(matching) {
      if (!matching || matching.status === 404) {
        return caches.match(OFFLINE_URL);
      } else {
        return matching;
      }
    });
  });
};

var addToCache = function(request) {
  return fetch(request).then(function(response) {
    if (response.ok) {
      return caches.open(CACHE_NAME).then(function(cache) {
        return cache.put(request, response.clone());
      });
    }
  }).catch(function(error) {
    console.error('Failed to cache request:', error);
  });
};