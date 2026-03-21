const CACHE_NAME = 'lecatex-pos-v3';

const BYPASS_URLS = [
    'firestore.googleapis.com',
    'firebase.googleapis.com',
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'googleapis.com',
    'gstatic.com/firebasejs',
    'firebaseapp.com',
    'google.com'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            Promise.allSettled([
                '/lecatex-express/',
                '/lecatex-express/index.html',
                '/lecatex-express/manifest.json'
            ].map(url => cache.add(url).catch(() => {})))
        )
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const url = event.request.url;
    // NO interceptar Firebase ni Google ni extensiones
    if (BYPASS_URLS.some(b => url.includes(b))) return;
    if (event.request.method !== 'GET') return;
    if (!url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            const fetchPromise = fetch(event.request.clone()).then(response => {
                if (response && response.status === 200 && response.type !== 'opaque') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(c => c.put(event.request, responseToCache));
                }
                return response;
            }).catch(() => cached);

            return cached || fetchPromise;
        })
    );
});
