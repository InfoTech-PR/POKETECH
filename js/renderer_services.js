/**
 * renderer_services.js
 * Renderização das telas de serviços (Centro Pokémon, Loja) e PvP.
 * NOVO: Contém a renderização da tela de Mapa (renderMapView).
 */

// Função auxiliar (global) para atualizar o subtotal na loja
window.updateSubtotal = function (inputId, itemCost) {
  const input = document.getElementById(inputId);
  const subtotalElement = document.getElementById(`subtotal-${inputId}`);

  if (input && subtotalElement) {
    let qty = parseInt(input.value);

    // Garante que a quantidade está entre 1 e 99
    if (isNaN(qty) || qty < 1) {
      qty = 1;
      input.value = 1;
    } else if (qty > 99) {
      qty = 99;
      input.value = 99;
    }

    const total = qty * itemCost;
    subtotalElement.textContent = `Subtotal: P$${total}`;

    // Oculta/Exibe botão de Compra se o jogador tiver dinheiro
    const buyButton = document.getElementById(`buy-btn-${inputId}`);
    if (buyButton) {
      if (window.gameState.profile.money < total) {
        buyButton.disabled = true;
        buyButton.classList.add("bg-gray-400");
        buyButton.classList.remove("bg-green-500", "hover:bg-green-600");
      } else {
        buyButton.disabled = false;
        buyButton.classList.remove("bg-gray-400");
        buyButton.classList.add("bg-green-500", "hover:bg-green-600");
      }
    }
  }
};

/**
 * Novo helper para buscar a quantidade de um item na mochila do jogador.
 * @param {string} itemName - O nome do item a ser verificado.
 * @returns {number} A quantidade do item.
 */
function getItemQuantity(itemName) {
  const item = window.gameState.profile.items.find((i) => i.name === itemName);
  return item ? item.quantity : 0;
}

export const RendererServices = {
  // ====================================================================
  // NOVO: MAPA MUNDIAL (BETA MODE)
  // ====================================================================

  renderMapView: function (app, extraData = {}) {
    window.MapCore.destroyMap(); // Garante que a instância anterior seja removida

    const profile = window.gameState.profile;
    const location = profile.lastLocation || { lat: 0, lng: 0 };
    // CORRIGIDO: Uso de optional chaining para garantir que a leitura de lat/lng não falhe
    const isReady = location.lat !== 0 || location.lng !== 0;
    const exploreBtnClass = isReady
      ? "bg-green-500 hover:bg-green-600"
      : "bg-gray-400 cursor-not-allowed";

    // A mensagem da batalha é passada em extraData.battleMessage
    const battleMessage = extraData.battleMessage || "";

    // Pega o estado do clima para exibição inicial
    // CORRIGIDO: Fallback para um objeto de clima padrão seguro, evitando 'undefined'
    const weather = window.gameState.currentWeather || {
      temperature: null,
      condition: "Carregando...",
      icon: "fa-question-circle",
      color: "text-gray-800",
      isDay: true,
    };

    const tempDisplay =
      weather.temperature !== null && weather.temperature !== undefined
        ? `${weather.temperature}°C`
        : "---";
    const conditionIcon = weather.icon || "fa-question-circle";
    const conditionColor = weather.color || "text-gray-800";
    const dayNightIcon = weather.isDay ? "fa-sun" : "fa-moon";
    const dayNightText = weather.isDay ? "DIA" : "NOITE";

    const content = `
            <div class="flex flex-col h-full w-full">
                <div class="text-lg font-bold text-center pt-2 text-red-600 gba-font flex-shrink-0">MAPA MUNDIAL (BETA)</div>
                <div class="text-center text-[10px] sm:text-xs text-gray-800 gba-font flex-shrink-0 mb-2">
                    SUA LOCALIZAÇÃO ESTÁ SENDO RASTREADA E SERÁ COMPARTILHADA COM AMIGOS.
                </div>
                
                <!-- PAINEL DE CLIMA -->
                <div id="current-weather-display" 
                     class="gba-font text-[10px] sm:text-xs bg-white border-2 border-gray-800 rounded-lg shadow-inner p-1.5 mb-2 text-center flex items-center justify-center space-x-2 flex-shrink-0">
                    <i class="fa-solid ${dayNightIcon} mr-1 text-yellow-500"></i>
                    <span class="mr-3">${dayNightText}</span>
                    <i class="fa-solid ${conditionIcon} mr-1 ${conditionColor}"></i>
                    <span class="mr-3 ${conditionColor}">${
      weather.condition || "Carregando..."
    }</span>
                    <i class="fa-solid fa-temperature-half mr-1 text-red-500"></i>
                    <span>${tempDisplay}</span>
                </div>

                <!-- CONTAINER DO MAPA -->
                <div id="map-container" class="flex-grow min-h-[50vh] bg-gray-300 border-4 border-gray-800 rounded-lg shadow-inner mb-2 relative">
                    <!-- Leaflet irá injetar o mapa aqui -->
                </div>
                
                <!-- LOG DE STATUS/EXPLORAÇÃO E POSIÇÃO -->
                <div class="flex flex-col space-y-1.5 mb-2 flex-shrink-0">
                  <div id="current-location-display" class="text-[10px] gba-font text-gray-800 p-1.5 bg-gray-300 border-2 border-gray-500 rounded-md">
                      POSIÇÃO: ${location.lat.toFixed(
                        4
                      )}, ${location.lng.toFixed(4)}
                  </div>
                  <div id="explore-log-display" class="gba-font text-[10px] sm:text-xs p-1.5 bg-gray-100 text-gray-800 border-2 border-gray-500 rounded-md">
                      Toque em "EXPLORAR" para procurar Pokémons.
                  </div>
                </div>

                <!-- BOTÕES DE AÇÃO -->
                <div class="flex-shrink-0 space-y-2">
                    <button onclick="window.MapCore.mapExplore()" 
                            class="gba-button ${exploreBtnClass} w-full"
                            ${isReady ? "" : "disabled"}>
                        EXPLORAR NESTA ÁREA
                    </button>
                    <button onclick="window.MapCore.destroyMap(); window.Renderer.showScreen('mainMenu')" 
                            class="gba-button bg-gray-500 hover:bg-gray-600 w-full">
                        Voltar ao Menu Principal
                    </button>
                </div>
            </div>
        `;
    window.Renderer.renderGbaCard(content);

    // Inicializa o mapa Leaflet APÓS a injeção do HTML
    // Passa a mensagem de batalha para ser exibida após o mapa carregar
    window.MapCore.initializeMap(profile.lastLocation, battleMessage);
  },

  // ====================================================================
  // TELAS DE SERVIÇOS E BATTLE (ORIGINAL)
  // ====================================================================

  renderHealCenter: function (app) {
    const profile = window.gameState.profile;
    const GameConfig = window.GameConfig;

    let totalHealable = 0;

    profile.pokemon.forEach((p) => {
      if (p.currentHp < p.maxHp) totalHealable++;
    });

    const totalCost = totalHealable * GameConfig.HEAL_COST_PER_POKE;
    const canHeal = totalHealable > 0 && profile.money >= totalCost;
    const statusMessage = canHeal
      ? `O custo para curar ${totalHealable} Pokémons é de P$${totalCost}.`
      : totalHealable === 0
      ? "Todos os seus Pokémons estão saudáveis."
      : `<span class="text-red-500">Dinheiro insuficiente para curar todos! Custo: P$${totalCost}</span>`;

    const content = `
            <div class="text-xl font-bold text-center mb-4 text-red-600 gba-font flex-shrink-0">CENTRO POKÉMON</div>
            <div class="text-center mb-4 text-sm gba-font flex-shrink-0">
                <p>Olá! Podemos cuidar de seus Pokémons.</p>
                <p class="mt-2">Dinheiro Atual: P$${profile.money}</p>
            </div>
            <!-- flex-grow e overflow-y-auto para a mensagem de status -->
            <div class="p-4 bg-white border-2 border-gray-800 rounded-lg shadow-inner mb-4 text-center gba-font text-xs flex-grow overflow-y-auto">
                ${statusMessage}
            </div>
            <button onclick="window.GameLogic.healAllPokemon()" class="gba-button bg-pink-500 hover:bg-pink-600 w-full mb-2 flex-shrink-0 ${
              !canHeal ? "disabled" : ""
            }" ${!canHeal ? "disabled" : ""}>
                CURAR TODOS
            </button>
            <button onclick="window.Renderer.showScreen('mainMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    window.Renderer.renderGbaCard(content);
  },

  renderShop: function (app) {
    const GameConfig = window.GameConfig;

    const shopItemsHtml = GameConfig.SHOP_ITEMS.map((item) => {
      const inputId = `qty-${item.name.replace(/\s/g, "")}`;
      const buyBtnId = `buy-btn-${inputId}`;
      const initialSubtotal = item.cost * 1;

      // NOVO: Busca a quantidade que o jogador já tem
      const currentQuantity = getItemQuantity(item.name);
      const quantityText =
        currentQuantity > 0
          ? `<span class="text-blue-700 gba-font text-[10px] ml-1">(Você tem: x${currentQuantity})</span>`
          : `<span class="text-red-500 gba-font text-[10px] ml-1">(Não possui)</span>`;

      const isAffordable = window.gameState.profile.money >= initialSubtotal;

      return `
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 border-b border-gray-300 flex-shrink-0">
              
              <!-- Ícone do Item e Nome -->
              <div class="flex items-center flex-grow min-w-0">
                ${
                  item.spriteUrl
                    ? `<img src="${item.spriteUrl}" alt="${item.name}" class="w-8 h-8 mr-2 flex-shrink-0">`
                    : item.isMove
                    ? `<img src="../assets/sprites/items/atack.png" alt="${item.name}" class="w-8 h-8 mr-2 flex-shrink-0">`
                    : ""
                }
                <div class="flex-grow min-w-0">
                    <span class="gba-font text-xs sm:text-sm">${
                      item.name
                    }</span>
                    <!-- NOVO: Mostra a quantidade atual do item -->
                    <p>${quantityText}</p>
                    <span class="gba-font text-[10px] sm:text-xs text-gray-600 block sm:inline"> (P$${
                      item.cost
                    } cada)</span>
                    ${
                      item.healAmount > 0
                        ? `<span class="gba-font text-[10px] text-green-600 block">Cura ${item.healAmount} HP</span>`
                        : item.ppRestore
                        ? `<span class="gba-font text-[10px] text-purple-600 block">Recupera PAs dos golpes</span>`
                        : item.isMove
                        ? `<span class="gba-font text-[10px] text-orange-600 block">${
                            item.description || "Ensina um movimento aleatório"
                          }</span>`
                        : ""
                    }
                    <!-- Subtotal dinâmico -->
                    <div id="subtotal-${inputId}" class="gba-font text-xs text-yellow-700 font-bold mt-1">
                        Subtotal: P$${initialSubtotal}
                    </div>
                </div>
              </div>

              <!-- Quantity Input and Button Group (Ações) -->
              <div class="flex items-center space-x-1 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                
                <!-- Botão Decrementar -->
                <button onclick="document.getElementById('${inputId}').value = Math.max(1, parseInt(document.getElementById('${inputId}').value) - 1); window.updateSubtotal('${inputId}', ${
        item.cost
      });"
                        class="w-8 h-8 gba-button bg-red-400 hover:bg-red-500 p-0 text-xl leading-none">-</button>
                
                <!-- Input de Quantidade -->
                <input id="${inputId}" type="number" value="1" min="1" max="${
        item.isMove ? "1" : "99"
      }"
                    oninput="window.updateSubtotal('${inputId}', ${item.cost})"
                    ${item.isMove ? "readonly" : ""}
                    class="w-16 p-1 border-2 border-gray-400 rounded gba-font text-sm text-center bg-white shadow-inner ${
                      item.isMove ? "bg-gray-200" : ""
                    }">
                
                <!-- Botão Incrementar -->
                <button onclick="document.getElementById('${inputId}').value = Math.min(99, parseInt(document.getElementById('${inputId}').value) + 1); window.updateSubtotal('${inputId}', ${
        item.cost
      });"
                        class="w-8 h-8 gba-button bg-blue-400 hover:bg-blue-500 p-0 text-xl leading-none">+</button>

                <!-- Botão Comprar -->
                <button id="${buyBtnId}"
                        onclick="window.GameLogic.buyItem('${
                          item.name
                        }', document.getElementById('${inputId}').value)" 
                        class="gba-button text-xs w-24 h-8 ${
                          isAffordable
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-gray-400"
                        }"
                        ${isAffordable ? "" : "disabled"}>
                    Comprar
                </button>
              </div>
            </div>
        `;
    }).join("");

    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">LOJA</div>
            <p class="text-center text-sm gba-font mb-4 flex-shrink-0">Seu Dinheiro: P$${window.gameState.profile.money}</p>
            <!-- flex-grow e overflow-y-auto para a lista de compras -->
            <div class="flex-grow overflow-y-auto border border-gray-400 p-2 mb-4 bg-white">${shopItemsHtml}</div>
            <button onclick="window.Renderer.showScreen('mainMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    window.Renderer.renderGbaCard(content);
  },

  renderPvpSetup: async function (app) {
    const PvpCore = window.PvpCore;

    let messages = "Escolha uma opção.";
    let disabledClass = "";

    if (!PvpCore.isPvpEnabled()) {
      messages =
        '<span class="text-red-600">O PvP está desativado. Chaves Firebase de Configuração não encontradas.</span>';
      disabledClass = "opacity-50 cursor-not-allowed";
    }

    // NOVO: Busca lista de amigos para PvP
    let friendsListHtml = "";
    if (window.db && window.userId && !window.userId.startsWith("anonimo")) {
      try {
        const { doc, getDoc, collection, getDocs, query, where } = await import(
          "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js"
        );
        const friendships = await window.PokeFriendship.listFriendships();

        const acceptedFriends = friendships.filter(
          (f) => f.status === "accepted"
        );

        if (acceptedFriends.length > 0) {
          const friendsWithData = await Promise.all(
            acceptedFriends.map(async (f) => {
              const friendId = f.participants.find(
                (id) => id !== window.userId
              );
              let friendName = "Treinador"; // Fallback padrão
              let friendAvatarUrl = null;

              try {
                const docRef = doc(window.db, "users", friendId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                  const data = docSnap.data();
                  // Busca o nome do treinador no perfil
                  friendName =
                    data.profile?.trainerName ||
                    data.trainerName ||
                    "Treinador";
                  if (data.preferences && data.preferences.avatarTrainerKey) {
                    // Importa getTrainerAvatarUrl do renderer_menus
                    const { TRAINER_AVATAR_CHOICES } = await import(
                      "./renderer_menus.js"
                    );
                    const getTrainerAvatarUrl = (profile) => {
                      if (!profile) return TRAINER_AVATAR_CHOICES[0].url;
                      const prefs = profile.preferences || {};
                      const selectedKey =
                        prefs.avatarTrainerKey || TRAINER_AVATAR_CHOICES[0].key;
                      return (
                        TRAINER_AVATAR_CHOICES.find(
                          (choice) => choice.key === selectedKey
                        )?.url || TRAINER_AVATAR_CHOICES[0].url
                      );
                    };
                    friendAvatarUrl = getTrainerAvatarUrl(data);
                  } else {
                    friendAvatarUrl =
                      "https://pbs.twimg.com/profile_images/1896626291606011904/IcRwMWBB.jpg";
                  }
                } else {
                  friendAvatarUrl =
                    "https://pbs.twimg.com/profile_images/1896626291606011904/IcRwMWBB.jpg";
                }
              } catch (error) {
                console.warn("Erro ao buscar dados do amigo:", error);
                friendAvatarUrl =
                  "https://pbs.twimg.com/profile_images/1896626291606011904/IcRwMWBB.jpg";
              }

              return { friendId, friendName, friendAvatarUrl };
            })
          );

          friendsListHtml = `
            <div class="bg-slate-900/90 border-4 border-purple-400 rounded-2xl p-4 shadow-2xl mb-4">
              <div class="flex items-center gap-2 mb-3">
                <i class="fa-solid fa-users text-xl text-purple-300"></i>
                <h2 class="gba-font text-sm text-purple-200 tracking-widest">DESAFIAR AMIGOS (${
                  friendsWithData.length
                })</h2>
              </div>
              <div class="grid gap-2 max-h-48 overflow-y-auto">
                ${friendsWithData
                  .map(
                    (f) => `
                  <div class="bg-slate-800/80 border border-purple-400/60 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center shadow-lg overflow-hidden border-2 border-purple-300">
                        <img src="${f.friendAvatarUrl}" alt="${
                      f.friendName
                    }" class="w-full h-full object-cover" onerror="this.src='https://pbs.twimg.com/profile_images/1896626291606011904/IcRwMWBB.jpg'">
                      </div>
                      <div class="gba-font text-xs text-purple-100">${
                        f.friendName
                      }</div>
                    </div>
                    <button onclick="window.Renderer.challengeFriendToPvp('${
                      f.friendId
                    }', '${f.friendName.replace(
                      /'/g,
                      "\\'"
                    )}')" class="gba-button bg-purple-500 hover:bg-purple-600 text-xs px-3 py-1" style="width:auto;">
                      Desafiar
                    </button>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `;
        }
      } catch (error) {
        console.error("Erro ao carregar amigos para PvP:", error);
      }
    }

    const content = `
            <div class="text-2xl font-bold text-center mb-6 text-white gba-font flex-shrink-0" style="text-shadow: 3px 3px 0px #000, 5px 5px 0px rgba(0,0,0,0.3); color: #fbbf24;">BATALHA PVP</div>
            ${friendsListHtml}
            <!-- flex-grow para a área de mensagens -->
            <div id="pvp-messages" class="h-20 p-3 mb-4 text-white rounded-lg overflow-y-auto text-sm gba-font flex-grow" style="background: rgba(0, 0, 0, 0.3); border: 2px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(4px); text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.5);">
                ${messages}
            </div>
            <button onclick="window.PvpCore.createPvpLink()" class="gba-button bg-purple-500 hover:bg-purple-600 w-full mb-3 flex-shrink-0 flex items-center justify-center gap-2 py-4 text-base font-bold ${disabledClass}" style="background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%); border: 4px solid #000; box-shadow: 0 4px 0 #000, 0 8px 16px rgba(0,0,0,0.2);" ${
      !PvpCore.isPvpEnabled() ? "disabled" : ""
    }>
                <i class="fa-solid fa-plus-circle text-xl"></i>
                <span>Criar Sala de Batalha</span>
            </button>
            <input id="pvpRoomInput" type="text" placeholder="ID da Sala para Entrar" class="w-full p-3 mb-3 rounded-lg gba-font text-sm flex-shrink-0 ${disabledClass}" style="background: rgba(255, 255, 255, 0.9); border: 3px solid #000; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);" ${
      !PvpCore.isPvpEnabled() ? "disabled" : ""
    }>
            <button onclick="window.PvpCore.joinPvpBattle(document.getElementById('pvpRoomInput').value.trim())" class="gba-button bg-orange-500 hover:bg-orange-600 w-full mb-3 flex-shrink-0 flex items-center justify-center gap-2 py-4 text-base font-bold ${disabledClass}" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border: 4px solid #000; box-shadow: 0 4px 0 #000, 0 8px 16px rgba(0,0,0,0.2);" ${
      !PvpCore.isPvpEnabled() ? "disabled" : ""
    }>
                <i class="fa-solid fa-sword text-xl"></i>
                <span>Entrar em Batalha</span>
            </button>
            <button onclick="window.Renderer.showScreen('mainMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0" style="border: 4px solid #000;">Voltar</button>
        `;
    window.Renderer.renderGbaCard(content);
  },

  renderPvpWaiting: function (roomId) {
    const app = document.getElementById("app-container");
    if (!app) return;

    const gbaScreen = document.querySelector(".gba-screen");
    if (!gbaScreen) return;

    const url = `${window.location.origin}${window.location.pathname}?pvp=${roomId}`;
    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">AGUARDANDO PVP</div>
            <!-- flex-grow para a área de mensagens -->
            <div id="pvp-message-wait" class="h-16 p-2 mb-4 bg-white border-2 border-gray-400 rounded overflow-y-auto text-sm gba-font flex-grow">
                Aguardando um oponente entrar na Sala ${roomId}.
            </div>
            <input id="pvpLink" type="text" value="${url}" readonly class="w-full p-1 mb-4 text-xs border border-gray-300 rounded flex-shrink-0" onclick="window.PvpCore.copyPvpLink()">
            <button onclick="window.Renderer.showScreen('mainMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    gbaScreen.innerHTML = content;
  },

  // CORRIGIDO: Removido o título "BATALHA SELVAGEM"
  renderBattleScreen: function (app) {
    const battle = window.gameState.battle;
    if (!battle) {
      window.Renderer.showScreen("mainMenu");
      return;
    }

    // Adicionado um pequeno cabeçalho visualmente menos intrusivo
    const battleType = battle.type === "pvp" ? "PVP" : "SELVA";

    const content = `
            
            <!-- Contêiner de Batalha (Onde o BattleCore injeta o HTML) -->
            <div id="battle-area" class="flex-grow flex flex-col justify-between p-2">
                <!-- Conteúdo de batalha será injetado aqui -->
                <p class="text-center gba-font text-sm text-gray-500">Carregando batalha...</p>
            </div>
        `;
    window.Renderer.renderGbaCard(content);
    // Injeta o conteúdo real da batalha (sprites, HP bars, log, buttons)
    window.BattleCore.updateBattleScreen();
  },

  // ADICIONADO: Função para a tela de troca de Pokémon, também usada na batalha
  renderSwitchPokemon: function (app) {
    const pokemonArray = window.gameState.profile.pokemon;
    const battle = window.gameState.battle;

    const currentActiveIndex = battle ? battle.playerPokemonIndex : 0;
    const forceSelection = Boolean(battle?.forceSwitchSelection);
    const forceMessage =
      battle?.forceSwitchMessage ||
      "Selecione um Pokémon em condições de lutar.";

    // NOVO: Filtra apenas os pokémons da equipe de batalha
    const battleTeamIndices =
      battle?.battleTeamIndices ||
      (window.gameState.profile.battleTeam &&
      window.gameState.profile.battleTeam.length > 0
        ? window.gameState.profile.battleTeam
        : pokemonArray.map((_, i) => i).slice(0, 5));

    const pokemonHtml = pokemonArray
      .map((p, index) => {
        // NOVO: Mostra apenas pokémons da equipe de batalha
        if (!battleTeamIndices.includes(index)) {
          return null;
        }

        const isCurrent = index === currentActiveIndex;
        const isDisabled = isCurrent || p.currentHp <= 0;
        const expToNextLevel = window.Utils.calculateExpToNextLevel(p.level);
        const expPercent = Math.min(100, (p.exp / expToNextLevel) * 100);

        return `
            <div class="flex items-center p-2 border-b border-gray-300 ${
              isDisabled ? "opacity-50" : "cursor-pointer hover:bg-gray-100"
            }"
                 onclick="${
                   isDisabled ? "" : `window.BattleCore.switchPokemon(${index})`
                 }">
                
                <img src="../assets/sprites/pokemon/${p.id}_front.png" alt="${
          p.name
        }" class="w-12 h-12 mr-2 flex-shrink-0">
                
                <div class="flex flex-col flex-grow min-w-0">
                    <div class="font-bold gba-font text-xs truncate">
                        ${window.Utils.getPokemonDisplayName(p)} (Nv. ${
          p.level
        }) 
                        ${
                          isCurrent
                            ? '<span class="text-[8px] text-green-600">(Em Campo)</span>'
                            : ""
                        }
                        ${
                          p.currentHp <= 0 && !isCurrent
                            ? '<span class="text-[8px] text-red-600">(Desmaiado)</span>'
                            : ""
                        }
                    </div>
                    <div class="text-[8px] gba-font flex items-center mt-1">
                        HP: ${p.currentHp}/${p.maxHp}
                        <div class="w-20 bg-gray-300 h-1.5 rounded-full border border-gray-500 ml-2">
                            <div class="h-1.5 rounded-full ${
                              p.currentHp / p.maxHp > 0.5
                                ? "bg-green-500"
                                : p.currentHp / p.maxHp > 0.2
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }" 
                                 style="width: ${Math.min(
                                   100,
                                   (p.currentHp / p.maxHp) * 100
                                 )}%;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
      })
      .filter((html) => html !== null)
      .join("");

    const forcedBanner = forceSelection
      ? `<div class="gba-font text-xs text-white text-center bg-red-500 border-4 border-black rounded-lg px-3 py-2 mb-3 shadow-lg">
            ${forceMessage}
         </div>`
      : "";

    const backButtonHtml = forceSelection
      ? `<button class="gba-button bg-gray-400 text-white opacity-60 cursor-not-allowed w-full flex-shrink-0" disabled>
            Escolha um Pokémon para continuar
         </button>`
      : `<button onclick="window.Renderer.showScreen('battle')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">
            Voltar para Batalha
         </button>`;

    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">TROCAR POKÉMON</div>
            
            ${forcedBanner}

            <div class="flex-grow overflow-y-auto border border-gray-400 p-2 mb-4 bg-white">
                ${
                  pokemonHtml ||
                  '<p class="text-center text-gray-500 gba-font p-4">Você não tem Pokémons!</p>'
                }
            </div>
            
            ${backButtonHtml}
        `;
    window.Renderer.renderGbaCard(content);
  },

  // NOVO: Renderiza a tela de chocar ovo com animação
  renderHatchEgg: function (app, extraData = {}) {
    console.log("[renderHatchEgg] Chamado com extraData:", extraData);

    const result = extraData?.result;

    if (result) {
      console.log(
        "[renderHatchEgg] Mostrando resultado para Pokémon:",
        result.name,
        "ID:",
        result.id
      );
      window._hatchEggRendering = false;
      // Mostra o resultado após a animação
      const pokemonDisplayName = window.Utils.getPokemonDisplayName(result);
      const content = `
        <div class="flex flex-col items-center justify-center h-full">
          <div class="text-2xl font-bold text-center mb-4 text-gray-800 gba-font">🎉 OVO CHOCADO!</div>
          <img src="../assets/sprites/pokemon/${result.id}_front.png" alt="${result.name}" class="w-32 h-32 mb-4">
          <div class="text-xl font-bold text-center mb-2 text-gray-800 gba-font">${pokemonDisplayName}</div>
          <div class="text-sm text-center mb-4 text-gray-600 gba-font">Nível 1</div>
          <div class="text-center mb-4 text-gray-700 gba-font text-sm">
            ${pokemonDisplayName} foi adicionado ao seu time!
          </div>
          <button onclick="window.Renderer.showScreen('pokemonList')" class="gba-button bg-blue-500 hover:bg-blue-600 w-full">
            Ver Pokémons
          </button>
          <button onclick="window.Renderer.showScreen('bag')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full mt-2">
            Voltar à Mochila
          </button>
        </div>
      `;
      window.Renderer.renderGbaCard(content);
    } else {
      // Mostra a animação do ovo tremendo - só choca ao clicar
      // O pokemonId será gerado aleatoriamente ao clicar no ovo
      const eggClickHandler = `if(!window.gameState?._hatchingEgg) { window.GameLogic.hatchEgg(); }`;
      const content = `
        <div class="flex flex-col items-center justify-center h-full">
          <div class="text-xl font-bold text-center mb-6 text-gray-800 gba-font">OVO PRONTO PARA CHOCAR</div>
          <div id="egg-container" class="relative" style="cursor: pointer;" onclick="${eggClickHandler}">
            <img src="../assets/sprites/items/egg.png" alt="Ovo" class="w-32 h-32 egg-shake" style="animation: shake 0.5s infinite; cursor: pointer; pointer-events: none;">
          </div>
          <div class="text-center mt-6 text-gray-600 gba-font text-sm">
            Clique no ovo para chocar!
          </div>
          <button onclick="window.Renderer.showScreen('bag')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full mt-4">
            Voltar à Mochila
          </button>
        </div>
        <style>
          @keyframes shake {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            10% { transform: translate(-5px, -5px) rotate(-2deg); }
            20% { transform: translate(5px, 5px) rotate(2deg); }
            30% { transform: translate(-5px, 5px) rotate(-2deg); }
            40% { transform: translate(5px, -5px) rotate(2deg); }
            50% { transform: translate(-5px, -5px) rotate(-2deg); }
            60% { transform: translate(5px, 5px) rotate(2deg); }
            70% { transform: translate(-5px, 5px) rotate(-2deg); }
            80% { transform: translate(5px, -5px) rotate(2deg); }
            90% { transform: translate(-5px, -5px) rotate(-2deg); }
          }
          .egg-shake {
            animation: shake 0.5s infinite;
            cursor: pointer;
            transition: transform 0.2s;
          }
          .egg-shake:hover {
            transform: scale(1.1);
          }
          #egg-container:hover {
            filter: brightness(1.1);
          }
        </style>
      `;
      window.Renderer.renderGbaCard(content);
      window._hatchEggRendering = false;
    }
  },
};
