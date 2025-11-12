// Service Worker para PokéTech PWA
// Versão: v3 - Otimizado para CloudPanel
const CACHE_NAME = 'poketech-v3';
const STATIC_CACHE = 'poketech-static-v3';

// Log de inicialização
console.log('[SW] Service Worker iniciado em:', self.location.origin);

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
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto:', CACHE_NAME);
        // Cacheia arquivos essenciais primeiro
        const essentialFiles = ['/', '/index.html', '/manifest.json'];
        return Promise.allSettled(
          essentialFiles.map(url => {
            return cache.add(url).catch(err => {
              console.warn(`[SW] Falha ao cachear ${url}:`, err.message);
              return null;
            });
          })
        ).then(() => {
          // Depois cacheia o resto
          return Promise.allSettled(
            urlsToCache.filter(url => !essentialFiles.includes(url)).map(url => {
              return cache.add(url).catch(err => {
                console.warn(`[SW] Falha ao cachear ${url}:`, err.message);
                return null;
              });
            })
          );
        });
      })
      .then(() => {
        console.log('[SW] ✅ Instalação concluída');
      })
      .catch((err) => {
        console.error('[SW] ❌ Erro durante instalação:', err);
      })
  );
  // Força ativação imediata sem esperar outras abas fecharem
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const deletePromises = cacheNames
        .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE)
        .map((cacheName) => {
          console.log('[SW] Removendo cache antigo:', cacheName);
          return caches.delete(cacheName);
        });
      return Promise.all(deletePromises);
    })
      .then(() => {
        console.log('[SW] ✅ Ativação concluída');
      })
  );
  // Assume controle imediato de todas as páginas abertas
  return self.clients.claim();
});

// Estratégia: Network First, fallback para Cache
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Ignora requisições do Firebase e APIs externas
  if (url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('open-meteo.com') ||
    url.hostname.includes('github.com') ||
    url.hostname.includes('pinimg.com') ||
    url.hostname.includes('jetta.vgmtreasurechest.com') ||
    url.hostname.includes('pokeapi.co') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('leaflet') ||
    url.hostname.includes('tumblr.com') ||
    url.hostname.includes('twitter.com') ||
    url.hostname.includes('redd.it') ||
    url.hostname.includes('wikia.nocookie.net') ||
    url.hostname.includes('pm1.aminoapps.com') ||
    url.hostname.includes('encrypted-tbn') ||
    url.hostname.includes('wallpapers-clan.com') ||
    url.hostname.includes('ignimgs.com') ||
    url.hostname.includes('i.redd.it') ||
    url.hostname.includes('oyster.ignimgs.com')) {
    return; // Deixa o navegador buscar normalmente
  }

  // Para requisições do mesmo domínio, usa estratégia network-first
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Tenta buscar da rede primeiro
        return fetch(event.request)
          .then((networkResponse) => {
            // Se a resposta da rede for válida, atualiza o cache
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Se a rede falhar, usa o cache
            if (cachedResponse) {
              return cachedResponse;
            }
            // Se não houver cache, retorna resposta de erro
            if (event.request.destination === 'document') {
              // Para páginas, retorna index.html do cache
              return caches.match('/index.html');
            }
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

