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
  '/assets/sprites/items/poke-ball.png',
  '/assets/sprites/items/great-ball.png',
  '/assets/sprites/items/ultra-ball.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estratégia: Cache First, depois Network
self.addEventListener('fetch', (event) => {
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
        });
      })
  );
});

