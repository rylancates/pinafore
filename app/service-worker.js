import {
  timestamp,
  assets as __assets__,
  shell as __shell__,
  routes as __routes__
} from './manifest/service-worker.js'

const ASSETS = `assets_${timestamp}`
const WEBPACK_ASSETS = `webpack_assets_${timestamp}`

// `assets` is an array of everything in the `assets` directory
const assets = __assets__
  .map(file => file.startsWith('/') ? file : `/${file}`)
  .filter(filename => !filename.startsWith('/apple-icon'))
  .concat(['/index.html'])

// `shell` is an array of all the files generated by webpack
// also contains '/index.html' for some reason
const webpackAssets = __shell__
  .filter(filename => !filename.endsWith('.map'))
  .filter(filename => filename !== '/index.html')

// `routes` is an array of `{ pattern: RegExp }` objects that
// match the pages in your app
const routes = __routes__

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    await Promise.all([
      caches.open(WEBPACK_ASSETS).then(cache => cache.addAll(webpackAssets)),
      caches.open(ASSETS).then(cache => cache.addAll(assets))
    ])
    self.skipWaiting()
  })())
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    let keys = await caches.keys()

    // delete old asset/ondemand caches
    for (let key of keys) {
      if (key !== ASSETS &&
          !key.startsWith('webpack_assets_')) {
        await caches.delete(key)
      }
    }

    // for webpack assets, keep the two latest builds because we may need
    // them when the service worker has installed but the page has not
    // yet reloaded (e.g. when it gives the toast saying "please reload"
    // but then you don't refresh and instead load an async chunk)
    let webpackKeysToDelete = keys
      .filter(key => key.startsWith('webpack_assets_'))
      .sort((a, b) => {
        let aTimestamp = parseInt(a.substring(15), 10)
        let bTimestamp = parseInt(b.substring(15), 10)
        return bTimestamp < aTimestamp ? -1 : 1
      })
      .slice(2)

    for (let key of webpackKeysToDelete) {
      await caches.delete(key)
    }

    await self.clients.claim()
  })())
})

self.addEventListener('fetch', event => {
  const req = event.request
  const method = req.method
  const url = new URL(req.url)
  const sameOrigin = url.origin === self.origin

  if (method !== 'GET') {
    return
  }

  // don't try to handle e.g. data: URIs
  if (!url.protocol.startsWith('http')) {
    return
  }

  // ignore dev server requests
  if (url.hostname === self.location.hostname && url.port !== self.location.port) {
    return
  }

  if (sameOrigin) {
    event.respondWith((async () => {
      // always serve webpack-generated resources and
      // assets from the cache if possible
      let response = await caches.match(req)
      if (response) {
        return response
      }
      // for routes, serve the /index.html file from the most recent
      // assets cache
      if (routes.find(route => route.pattern.test(url.pathname))) {
        let response = await caches.match('/index.html')
        if (response) {
          return response
        }
      }
      return fetch(req)
    })())
  }
})
