/**
 * map_core.js
 * Módulo para gerenciar a lógica central do Mapa Mundial (Beta Mode).
 * Inclui inicialização, rastreamento de localização e marcadores de amigos.
 */

// Armazenamento da instância do mapa e do marcador do jogador para controle
let mapInstance = null;
let playerMarker = null;
let locationWatcherId = null;
let currentTileLayer = null; // Para armazenar a camada ativa e removê-la

// URLs de Estilo do Mapa
const MAP_LAYERS = {
    DAY: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    NIGHT: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png' // Tema escuro do CartoDB
};

// Localização padrão: Los Angeles (para evitar NaN/null na primeira renderização)
const DEFAULT_LOCATION = { lat: 34.0522, lng: -118.2437 };
const WEATHER_FETCH_INTERVAL = 300000; // 5 minutos em milissegundos (Ajustado para testes)

export const MapCore = {
    /**
     * Função auxiliar para trocar a camada do mapa (dia/noite).
     * @param {boolean} isDay Se o mapa deve usar o tema de dia.
     */
    _updateMapLayer: function (isDay) {
        if (!mapInstance) return;

        // 1. Remove a camada atual, se existir
        if (currentTileLayer) {
            mapInstance.removeLayer(currentTileLayer);
        }

        // 2. Define o URL e cria a nova camada
        const layerUrl = isDay ? MAP_LAYERS.DAY : MAP_LAYERS.NIGHT;
        currentTileLayer = L.tileLayer(layerUrl, {
            maxZoom: 19,
            attribution: isDay ? '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' : '&copy; <a href="http://carto.com/attributions">CartoDB</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(mapInstance);

        // Garante que o marcador do jogador permaneça no topo da nova camada
        if (playerMarker) {
            playerMarker.setZIndexOffset(1000);
        }
    },


    /**
     * Função para buscar dados de clima da Open-Meteo API.
     * Armazena os dados em window.gameState.currentWeather.
     * @param {number} lat Latitude
     * @param {number} lng Longitude
     */
    fetchWeather: async function (lat, lng) {
        const { WEATHER_API_URL, WEATHER_MAP } = window.GameConfig;
        const now = Date.now();

        // Garante que currentWeather é inicializado de forma segura
        window.gameState.currentWeather = window.gameState.currentWeather || { lastFetch: 0, rawCode: -1 };
        let currentWeather = window.gameState.currentWeather;

        // 1. Verifica o limite de taxa de requisição
        if (now - (currentWeather.lastFetch || 0) < WEATHER_FETCH_INTERVAL) {
            console.log("[CLIMA] Usando dados em cache. Última busca: ", new Date(currentWeather.lastFetch).toLocaleTimeString());
            // Chama a atualização da camada mesmo no cache
            MapCore._updateMapLayer(currentWeather.isDay);
            return;
        }

        try {
            const url = `${WEATHER_API_URL}?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,is_day&timezone=auto&forecast_days=1`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const current = data.current;

            const wmoCode = current.weather_code;
            const isDay = current.is_day === 1;
            const temp = Math.round(current.temperature_2m);

            const conditionData = WEATHER_MAP[wmoCode] || WEATHER_MAP[0];

            const newWeatherState = {
                isDay: isDay,
                temperature: temp,
                condition: conditionData.name,
                icon: conditionData.icon,
                rawCode: wmoCode,
                lastFetch: now,
                color: conditionData.color,
            };

            window.gameState.currentWeather = newWeatherState;
            window.GameLogic.saveGameData();
            console.log("[CLIMA] Dados de clima atualizados:", newWeatherState);

            // NOVIDADE CRÍTICA: Troca a camada do mapa imediatamente após buscar o clima
            MapCore._updateMapLayer(newWeatherState.isDay);

        } catch (error) {
            console.error("[CLIMA] Erro ao buscar dados de clima:", error);
            window.gameState.currentWeather = {
                isDay: true, // Fallback para dia em caso de erro de API
                temperature: null,
                condition: "Dados Indisponíveis",
                icon: "fa-question-circle",
                rawCode: -1,
                lastFetch: now,
                color: "text-red-500",
            };
        }
    },


    /**
     * 1. Destrói a instância atual do mapa Leaflet para evitar o erro de reutilização.
     */
    destroyMap: function () {
        if (mapInstance) {
            mapInstance.remove();
            mapInstance = null;
            currentTileLayer = null; // Limpa a referência da camada
            console.log("[MAPA] Instância do mapa Leaflet destruída.");
        }
        // Para o rastreamento de localização se estiver ativo
        if (locationWatcherId !== null && navigator.geolocation) {
            navigator.geolocation.clearWatch(locationWatcherId);
            locationWatcherId = null;
            console.log("[MAPA] Rastreamento de localização parado.");
        }
    },

    /**
     * 2. Inicializa o mapa Leaflet e o marcador do jogador.
     */
    initializeMap: function (initialLocation, battleMessage = null) {
        // 1. Garante que qualquer instância anterior seja destruída
        MapCore.destroyMap();

        const location = initialLocation || DEFAULT_LOCATION;

        // 2. Inicializa o mapa no container
        const mapContainer = "map-container";
        if (!document.getElementById(mapContainer)) {
            console.error("[MAPA] Contêiner do mapa não encontrado (ID: map-container).");
            return;
        }

        try {
            // Cria a instância Leaflet
            mapInstance = L.map(mapContainer, {
                zoomControl: false,
                attributionControl: false,
            }).setView([location.lat, location.lng], 13);

            // 3. Inicializa a camada do mapa como padrão (DAY) até que o clima seja carregado
            const initialIsDay = window.gameState.currentWeather?.isDay ?? true;
            MapCore._updateMapLayer(initialIsDay);


            // Ícone Customizado para o Jogador 
            const playerIconHtml = `
          <div class="flex items-center justify-center bg-blue-600 rounded-full w-6 h-6 border-2 border-white shadow-lg text-white font-bold text-xs">
              ${window.gameState.profile.trainerName.charAt(0)}
          </div>
      `;
            const playerIcon = L.divIcon({
                className: 'player-marker-icon',
                html: playerIconHtml,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            // Marcador do Jogador
            playerMarker = L.marker([location.lat, location.lng], {
                icon: playerIcon,
                title: window.gameState.profile.trainerName + " (Você)"
            }).addTo(mapInstance);

            // Popup de Identificação
            playerMarker.bindPopup(`<strong>${window.gameState.profile.trainerName}</strong> (Você)`).openPopup();

            // 4. Inicia o rastreamento de localização e o fetch do clima
            MapCore.startLocationTracking(battleMessage);

            // 5. Se houver mensagem de batalha, exibe-a no modal
            if (battleMessage) {
                window.Utils.showModal("infoModal", `<div class="text-left"><h3 class="font-bold gba-font text-base mb-2">FIM DA BATALHA</h3>${battleMessage}</div>`);
            }

            // 6. Atualiza o log e o display do clima
            MapCore.updateStatusLog(battleMessage);


        } catch (error) {
            console.error("[MAPA] Erro ao inicializar o mapa Leaflet:", error);
            MapCore.updateStatusLog(`ERRO: Falha ao carregar o mapa. Detalhe: ${error.message.substring(0, 50)}. Recarregue a página.`, true);
        }
    },

    /**
     * 3. Inicia o rastreamento em tempo real da geolocalização do jogador.
     */
    startLocationTracking: function (initialBattleMessage = null) {
        if (!navigator.geolocation) {
            MapCore.updateStatusLog("ERRO DE GEOLOCALIZAÇÃO: Navegador não suporta.", true);
            // Tenta carregar o clima com o último ponto conhecido (pode estar desatualizado)
            if (window.gameState.profile.lastLocation.lat !== DEFAULT_LOCATION.lat) {
                MapCore.fetchWeather(window.gameState.profile.lastLocation.lat, window.gameState.profile.lastLocation.lng)
                    .then(() => MapCore.updateStatusLog(initialBattleMessage));
            }
            return;
        }

        const updatePlayerLocation = (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const newLatlng = L.latLng(lat, lng);

            // Atualiza o marcador do jogador
            playerMarker.setLatLng(newLatlng);

            // Salva a nova localização no estado e Firestore
            window.gameState.profile.lastLocation = { lat, lng };
            window.GameLogic.saveGameData();

            // Busca o clima (com limitação de taxa) e atualiza o display
            MapCore.fetchWeather(lat, lng).then(() => {
                MapCore.updateStatusLog(initialBattleMessage);
                // Limpa a mensagem de batalha após o primeiro update
                if (initialBattleMessage) { initialBattleMessage = null; }
            });

            // Após a primeira atualização, centraliza o mapa
            if (mapInstance && mapInstance._playerMovedOnce !== true) {
                mapInstance.setView(newLatlng, 16);
                mapInstance._playerMovedOnce = true;
            }

            // Atualiza marcadores de amigos (próxima etapa)
            MapCore.updateFriendMarkers();
        };

        const locationError = (error) => {
            let errorMsg;
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = "Permissão de localização negada.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = "Localização não disponível.";
                    break;
                case error.TIMEOUT:
                    errorMsg = "Tempo esgotado ao buscar localização.";
                    break;
                default:
                    errorMsg = "Erro desconhecido de geolocalização.";
                    break;
            }

            const location = window.gameState.profile.lastLocation || DEFAULT_LOCATION;
            MapCore.updateStatusLog(`ERRO DE GEOLOCALIZAÇÃO: ${errorMsg}. Usando última posição salva.`, true);

            // Tenta carregar o clima com o último ponto conhecido (pode estar desatualizado)
            if (location.lat !== DEFAULT_LOCATION.lat) {
                MapCore.fetchWeather(location.lat, location.lng)
                    .then(() => MapCore.updateStatusLog(initialBattleMessage));
            }
        };

        // Opções de alta precisão
        const geoOptions = {
            enableHighAccuracy: true,
            timeout: 10000, // 10 segundos
            maximumAge: 0
        };

        // Tenta obter a posição inicial (para acionar o prompt) e inicia o watch
        const initialCall = (position) => {
            updatePlayerLocation(position);
            // Inicia o rastreamento contínuo
            locationWatcherId = navigator.geolocation.watchPosition(updatePlayerLocation, locationError, geoOptions);
        };

        // Tenta a chamada inicial. Se falhar na primeira tentativa, ainda assim inicia o watch.
        navigator.geolocation.getCurrentPosition(initialCall, locationError, geoOptions);

        console.log("[MAPA] Solicitação de rastreamento de localização enviada.");
    },

    /**
     * 4. Lógica de exploração no mapa (a ser implementada).
     */
    mapExplore: async function () {
        const hasLivePokemon = window.gameState.profile.pokemon.some(
            (p) => p.currentHp > 0
        );
        if (!hasLivePokemon && window.gameState.profile.pokemon.length > 0) {
            MapCore.updateStatusLog("Todos os Pokémons desmaiaram! Vá para o Centro Pokémon.", true);
            return;
        }

        window.GameLogic.addExploreLog("Explorando a área..."); // Adiciona log antes da ação

        // Simulação de encontro com Pokémon (50% de chance)
        const encounterRoll = Math.random();

        if (encounterRoll < 0.5) {
            // Inicia a batalha
            window.AuthSetup?.handleBattleMusic(true);
            await window.BattleCore.startWildBattle();
            // O fluxo continua em BattleCore._endBattleAndSyncLog
        } else {
            // Ações não-batalha
            const moneyRoll = Math.random();
            if (moneyRoll < 0.3) {
                const money = Math.floor(Math.random() * 200) + 100;
                window.gameState.profile.money += money;
                window.GameLogic.saveGameData();
                window.GameLogic.addExploreLog(`Você encontrou P$${money} no chão!`);
            } else {
                window.GameLogic.addExploreLog("Você explorou, mas a área está calma.");
            }
        }
        // Atualiza o log do mapa para mostrar o resultado da exploração
        MapCore.updateStatusLog();
    },

    /**
     * 5. Lida com o retorno da batalha (chamado pelo battle_core).
     * @param {string} finalMessage - A última mensagem do log de batalha.
     */
    handleBattleReturn: function (finalMessage) {
        MapCore.destroyMap(); // Garante a destruição para inicialização limpa
        // Passa a mensagem para ser exibida no modal após o mapa carregar
        window.Renderer.showScreen('mapView', { battleMessage: finalMessage });
    },

    /**
     * 6. Atualiza o painel de log de status na tela do mapa.
     * @param {string} overrideMessage - (Opcional) Mensagem de erro temporário (ex: erro de geolocalização).
     * @param {boolean} isError - Se deve ser exibida como erro.
     */
    updateStatusLog: function (overrideMessage = null, isError = false) {
        const logElement = document.getElementById("explore-log-display");
        const posElement = document.getElementById("current-location-display");
        const weatherElement = document.getElementById("current-weather-display");

        // 1. Determina a mensagem principal
        let displayMessage;
        let isDisplayError = isError;

        if (overrideMessage) {
            displayMessage = overrideMessage;
        } else if (window.gameState.exploreLog?.length > 0) {
            // Usa a última linha do exploreLog para mensagens de jogo (padrão)
            const allLogs = window.gameState.exploreLog;
            displayMessage = allLogs.slice(-1)[0];
            isDisplayError = false; // Resetar status de erro para o log normal
        } else {
            displayMessage = "Pronto para explorar! Clique em EXPLORAR NESTA ÁREA.";
        }

        // 2. Atualiza o elemento de log
        if (logElement) {
            logElement.textContent = displayMessage;
            logElement.className = `gba-font text-[10px] sm:text-xs p-1.5 ${isDisplayError ? 'bg-red-200 text-red-800' : 'bg-gray-100 text-gray-800'}`;
        }

        // 3. Atualiza a posição (sempre, se o elemento existir)
        if (posElement) {
            const location = window.gameState.profile.lastLocation || DEFAULT_LOCATION;
            const latDisplay = location.lat ? location.lat.toFixed(4) : '---';
            const lngDisplay = location.lng ? location.lng.toFixed(4) : '---';
            posElement.innerHTML = `POSIÇÃO: ${latDisplay}, ${lngDisplay}`;
        }

        // 4. Atualiza o clima (CORRIGIDO: Leitura segura de gameState.currentWeather)
        if (weatherElement) {
            // Força um objeto de clima seguro para a UI, caso não esteja definido
            const weather = window.gameState.currentWeather || {};

            const tempDisplay = weather.temperature !== null && weather.temperature !== undefined ? `${weather.temperature}°C` : '---';
            const conditionIcon = weather.icon || "fa-question-circle";
            const conditionColor = weather.color || 'text-gray-800';
            const dayNightIcon = weather.isDay ? 'fa-sun' : 'fa-moon';
            // A transição é gerenciada pela API (is_day = 0 é noite)
            const dayNightText = weather.isDay ? 'DIA' : 'NOITE';

            // Re-injeta o HTML de clima aqui para que as atualizações em tempo real funcionem.
            weatherElement.innerHTML = `
                <i class="fa-solid ${dayNightIcon} mr-1 text-yellow-500"></i>
                <span class="mr-3">${dayNightText}</span>
                <i class="fa-solid ${conditionIcon} mr-1 ${conditionColor}"></i>
                <span class="mr-3 ${conditionColor}">${weather.condition || 'Carregando...'}</span>
                <i class="fa-solid fa-temperature-half mr-1 text-red-500"></i>
                <span>${tempDisplay}</span>
            `;
        }
    },

    /**
     * 7. (A ser implementada) Busca amigos e coloca marcadores no mapa.
     */
    updateFriendMarkers: function () {
        // PRÓXIMA ETAPA: Implementar a busca de amigos, suas localizações
        // no Firestore e renderizar marcadores coloridos.
        // E.g., window.PokeFriendship.getFriendsLocation().then(locations => { ... });
    },

    /**
     * 8. (A ser implementada) Abre o modal de interação com o amigo (Chat/Troca).
     */
    openFriendInteraction: function (friendId, friendName) {
        // Abre o modal de interação com opções de troca
        const modalHtml = `
          <div class="text-lg font-bold gba-font mb-4">Interagir com ${friendName}</div>
          <p class="text-sm gba-font mb-4">O que você gostaria de fazer?</p>
          <button onclick="window.Utils.hideModal('infoModal'); window.GameLogic.startTrade('${friendId}', '${friendName}')" 
                  class="gba-button bg-green-500 hover:bg-green-600 w-full mb-2">
              Trocar Pokémon
          </button>
          <button onclick="window.Utils.hideModal('infoModal')" 
                  class="gba-button bg-gray-500 hover:bg-gray-600 w-full">
              Cancelar
          </button>
      `;
        window.Utils.showModal("infoModal", modalHtml);
    },
};
