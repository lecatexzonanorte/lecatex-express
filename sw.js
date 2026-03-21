const CACHE_NAME = 'lecatex-pos-v2';

const BYPASS_URLS = [
    'firestore.googleapis.com',
    'firebase.googleapis.com',
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'googleapis.com',
    'gstatic.com/firebasejs',
    'firebaseapp.com',
    'google.com/images'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            Promise.allSettled([
                '/lecatex-express/',
                '/lecatex-express/index.html',
                '/lecatex-express/manifest.json',
                'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js'
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
    // NO interceptar Firebase ni Google
    if (BYPASS_URLS.some(b => url.includes(b))) return;
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                if (!response || response.status !== 200 || response.type === 'opaque') return response;
                caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()));
                return response;
            }).catch(() => cached || new Response('Sin conexión', { status: 503 }));
        })
    );
});
