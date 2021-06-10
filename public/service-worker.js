const FILES_TO_CACHE = [
  '/',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/index.js',
  '/manifest.webmanifest',
  '/styles.css'
]

const STATIC_CACHE = 'static-cache-v1'
const DATA_CACHE = 'data-cache-v1'

// install
self.addEventListener('install', (e) => {
  // pre cache budget data
  e.waitUntil(
    caches.open(DATA_CACHE).then((cache) => cache.add('/api/transaction'))
  )

  // pre cache static data
  e.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(FILES_TO_CACHE))
  )

  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== STATIC_CACHE && key !== DATA_CACHE) {
            console.log('Removing old cache data', key)
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => { // if a fetch request occurs
  if (e.request.url.includes('/api')) { // if the request url contains /api
    console.log('[Service Worker] Fetch (data)', e.request.url) // console log the request url
    e.respondWith( // respond with custom functionality
      caches.open(DATA_CACHE).then((cache) => { // open the cache
        return fetch(e.request) // and return the fetched data
          .then((response) => {
            if (response.status === 200) { // if the fetch response is good
              cache.put(e.request.url, response.clone()) // put the fetched data as a clone into the cache
            }
            return response // return the fetch response
          })
          .catch((err) => { // if the fetch response errors
            console.log(err)
            return cache.match(e.request) // return the cached data
          })
      })
    )
    return
  }

  e.respondWith( // if the fetch is not an api request
    caches.open(STATIC_CACHE).then((cache) => { // then open the cache for static files
      return cache.match(e.request).then((response) => { // checks for matching data in cache
        return response || fetch(e.request) // if the data exists return the response else fetch new data
      })
    })
  )
})
