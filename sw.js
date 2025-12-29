const CACHE_NAME = 'poketech-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/js/app.js',
  '/js/config_utils.js',
  '/js/battle_core.js',
  '/js/game_logic.js',
  '/js/renderer.js',
  '/js/renderer_core.js',
  '/js/renderer_menus.js',
  '/js/renderer_pokemon.js',
  '/js/renderer_services.js',
  '/js/auth_setup.js',
  '/js/map_core.js',
  '/js/pvp_core.js',
  '/js/poke_chat.js',
  '/js/poke_friendship.js',
  '/js/local_poke_data.js',
  '/js/branched_evos.js',
  '/js/evolution_rules.js',
  '/game_updates.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Tenta cachear todos, mas não falha se alguns falharem
        return Promise.allSettled(
          urlsToCache.map(url =>
            cache.add(url).catch(err => {
              console.warn(`Falha ao cachear ${url}:`, err);
              return null;
            })
          )
        );
      })
  );
  // Força ativação imediata sem esperar outras abas fecharem
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Assume controle imediato de todas as páginas abertas
  return self.clients.claim();
});

// Estratégia: Cache First, depois Network
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Sempre serve o manifest.json do cache se disponível
  if (url.pathname === '/manifest.json') {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retorna resposta do cache
        if (response) {
          return response;
        }

        // Clona a requisição porque é um stream
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Verifica se recebemos uma resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clona a resposta porque é um stream
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Se a rede falhar, retorna resposta do cache se disponível
          return response || new Response('Offline', { status: 503 });
        });
      })
  );
});

