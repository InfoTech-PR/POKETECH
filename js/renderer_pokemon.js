// renderer_pokemon.js
// Renderização das telas de Pokémons (Lista, Gerenciamento, Pokédex) e Mochila.

// ESTADO GLOBAL: Variável para persistir os filtros da Pokédex entre as renderizações
window.currentPokedexFilters = window.currentPokedexFilters || {
  search: '',
  type: 'all',
  region: null // Adicionado para rastrear a região atual
};

// NOVO ESTADO GLOBAL: Variável para persistir os filtros da lista de pokémons
window.currentPokemonListFilters = window.currentPokemonListFilters || {
  search: '',
  type: 'all',
  favorite: 'all' // 'all', 'favorite', 'not-favorite'
};

// NOVO ESTADO GLOBAL: Variável temporária para carregar o payload (extraData)
// para a próxima tela de forma robusta, contornando o bug de passagem de argumentos.
window.nextScreenPayload = null;


/**
 * NOVO: Função auxiliar global para garantir que o clique na região
 * passe os dados corretamente para a navegação.
 * @param {string} regionId - O ID da região (ex: 'kanto').
 */
window.openPokedexRegion = function (regionId) {
  console.log('[POKEDEX NAV HELPER] Chamado openPokedexRegion com ID:', regionId);
  if (regionId) {
    const payload = { region: regionId };
    window.currentPokedexFilters.region = regionId; // Salva a região
    // Armazena o payload em uma variável global acessível pela função showScreen.
    window.nextScreenPayload = payload;
    // Chama showScreen SEM o argumento extraData, confiando que ele será buscado globalmente.
    window.Renderer.showScreen('pokedex');
  } else {
    console.error('[POKEDEX NAV HELPER] ID da região ausente!');
  }
};

export const RendererPokemon = {

  // ====================================================================
  // FUNÇÕES AUXILIARES INTERNAS DO MÓDULO
  // ====================================================================

  /**
   * Renderiza um item individual da cadeia evolutiva.
   * @param {object} evo Dados do Pokémon na cadeia.
   * @param {number} spriteId ID para o sprite.
   * @param {Set<number>} pokedexSet Set de Pokémons capturados.
   * @param {number} currentPokemonId ID do Pokémon atualmente visualizado.
   * @returns {string} HTML do item.
   */

  _regionColor: function (regionId) {
    const MAP = {
      kanto: '#d32f2f',
      johto: '#1976d2',
      hoenn: '#388e3c',
      sinnoh: '#7b1fa2',
      unova: '#455a64',
      kalos: '#f57c00',
      alola: '#00897b',
      galar: '#c2185b',
      paldea: '#512da8',
      paranagua: '#00acc1'
    };
    return MAP[regionId] || '#3b82f6';
  },

  _renderEvoItem: function (evo, spriteId, pokedexSet, currentPokemonId) {
    const isKnown = pokedexSet.has(evo.id);
    // filter: grayscale(100%) brightness(0.1); -> Sombra clara para Pokémon não descoberto mas clicável
    const silhouetteFilter = "filter: grayscale(100%) brightness(0.1);";

    let filterStyle = isKnown || (evo.id === currentPokemonId) ? "" : silhouetteFilter;
    let displayName = isKnown ? window.Utils.formatName(evo.name) : "???";
    const isActive = evo.id === currentPokemonId;

    return `
      <div class="flex flex-col items-center flex-shrink-0 w-20 p-1 bg-white shadow-md rounded-lg mb-1 transition-transform hover:scale-105">
        <img src="../assets/sprites/pokemon/${spriteId}_front.png" alt="${displayName}" class="w-12 h-12 mb-1  ${isActive ? 'border border-4 border-yellow-500 rounded-full' : ''}" style="${filterStyle}">
        <span class="text-[8px] gba-font text-center">${displayName}</span>
      </div>
    `;
  },

  // 2) Métodos a adicionar em export const RendererPokemon = { ... }

  _renderHealUi: function (p, pokemonIndex) {
    const profile = window.gameState.profile;
    window.Utils.ensureMoveCounters(p);
    const supportItems = (profile.items || []).filter(
      (i) => i.quantity > 0 && (i.healAmount > 0 || i.ppRestore)
    );

    const pending = window.gameState.pendingSupportItem;
    const defaultItemName = pending && supportItems.find((i) => i.name === pending)
      ? pending
      : supportItems[0]?.name;

    const canUseNow = (() => {
      if (!defaultItemName) return false;
      const item = supportItems.find((i) => i.name === defaultItemName);
      if (!item) return false;
      if (item.healAmount > 0) {
        return p.currentHp < p.maxHp;
      }
      if (item.ppRestore) {
        return (
          p.normalMoveRemaining < p.normalMoveMaxUses ||
          p.specialMoveRemaining < p.specialMoveMaxUses
        );
      }
      return false;
    })();

    const selectId = `healItemSelect-${pokemonIndex}`;
    const options = supportItems
      .map((item) => {
        const effect =
          item.healAmount > 0
            ? `+${item.healAmount} HP`
            : "Recupera PA";
        const selected =
          defaultItemName && item.name === defaultItemName ? "selected" : "";
        return `<option value="${item.name}" ${selected}>${item.name} (${effect}) x${item.quantity}</option>`;
      })
      .join("");

    return `
    <div class="mt-2 p-2 border-t border-gray-400">
      <h3 class="font-bold gba-font text-sm mb-2 text-center text-green-700">ITENS DE SUPORTE</h3>

      ${supportItems.length ? `
        <div class="flex items-center space-x-2">
          <select id="${selectId}" class="flex-grow p-1 border-2 border-gray-800 rounded gba-font text-xs bg-white shadow-inner">
            ${options}
          </select>
          <button
            onclick="RendererPokemon._useHealItemOnPokemon(${pokemonIndex})"
            class="gba-button ${canUseNow ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'}"
            ${canUseNow ? '' : 'disabled'}
            data-select="${selectId}">
            Usar
          </button>
        </div>
        <p class="text-[10px] gba-font text-gray-600 mt-1">Poções recuperam HP. Éteres recarregam PAs.</p>
      ` : `
        <div class="text-center text-[10px] gba-font text-gray-600">Sem itens de suporte disponíveis.</div>
        <button onclick="window.Utils.hideModal('pokemonStatsModal'); window.Renderer.showScreen('bag')"
                class="gba-button bg-blue-500 hover:bg-blue-600 w-full mt-2">
          Ir à Mochila
        </button>
      `}
    </div>
  `;
  },

  // ====================================================================
  // FUNÇÕES DE RENDERIZAÇÃO PÚBLICAS
  // ====================================================================

  renderPokemonList: function (app, extraData = {}) {
    const pendingSupportItem =
      extraData?.action === "useItem" && extraData?.item
        ? extraData.item
        : null;
    window.gameState.pendingSupportItem = pendingSupportItem || null;

    // NOVO: Inicializa filtros se não existirem
    const filters = window.currentPokemonListFilters || {
      search: '',
      type: 'all',
      favorite: 'all'
    };
    window.currentPokemonListFilters = filters;

    // NOVO: Filtra os pokémons
    let pokemonArray = window.gameState.profile.pokemon;
    
    // Filtro por busca (nome)
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim().toLowerCase();
      pokemonArray = pokemonArray.filter(p => {
        const displayName = window.Utils.getPokemonDisplayName(p).toLowerCase();
        const originalName = p.name.toLowerCase();
        return displayName.includes(searchTerm) || originalName.includes(searchTerm);
      });
    }
    
    // Filtro por tipo
    if (filters.type && filters.type !== 'all') {
      pokemonArray = pokemonArray.filter(p => {
        const types = p.types || [];
        return types.some(t => t.toLowerCase() === filters.type.toLowerCase());
      });
    }
    
    // Filtro por favorito
    if (filters.favorite && filters.favorite !== 'all') {
      if (filters.favorite === 'favorite') {
        pokemonArray = pokemonArray.filter(p => p.isFavorite === true);
      } else if (filters.favorite === 'not-favorite') {
        pokemonArray = pokemonArray.filter(p => !p.isFavorite);
      }
    }

    // NOVO: Obtém todos os tipos únicos dos pokémons para o filtro
    const allTypes = new Set();
    window.gameState.profile.pokemon.forEach(p => {
      if (p.types && Array.isArray(p.types)) {
        p.types.forEach(t => allTypes.add(t.toLowerCase()));
      }
    });
    const uniqueTypes = Array.from(allTypes).sort();

    const pokemonHtml = pokemonArray
      .map((p, originalIndex) => {
        // NOVO: Encontra o índice original no array completo
        const fullArray = window.gameState.profile.pokemon;
        const actualIndex = fullArray.findIndex(pok => pok === p);
        const expToNextLevel = window.Utils.calculateExpToNextLevel(p.level);
        const expPercent = Math.min(100, (p.exp / expToNextLevel) * 100);
        const isCurrentActive = actualIndex === 0;
        const isFavorite = p.isFavorite === true;

        return `
        <!-- ITEM PRINCIPAL - SEM DRAG/DROP. USADO APENAS PARA ROLAGEM E RECEBER DROP -->
        <div id="pokemon-list-item-${actualIndex}" 
             data-pokemon-index="${actualIndex}"
             ondragover="window.GameLogic.allowDrop(event)"
             ondrop="window.GameLogic.drop(event)"
             ondragenter="window.GameLogic.dragEnter(event)"
             ondragleave="window.GameLogic.dragLeave(event)"
             class="flex items-center justify-between p-2 border-b border-gray-300 transition-colors duration-100 ${p.currentHp <= 0 ? "opacity-50" : ""} ${isFavorite ? 'bg-yellow-50 border-yellow-300' : ''}">
            
            <!-- ÁREA 1: DRAG HANDLE (PONTINHOS) - ÚNICO ELEMENTO ARRASTÁVEL -->
            <div data-drag-handle="true"
                 data-pokemon-index="${actualIndex}"
                 draggable="true"
                 ondragstart="window.GameLogic.dragStart(event)"
                 class="p-2 cursor-grab text-gray-500 hover:text-gray-800 active:text-blue-600 flex-shrink-0"
                 title="Arrastar para reordenar">
                <!-- Ícone de handle (Três barras verticais) -->
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-grip-vertical" viewBox="0 0 16 16">
                  <path d="M7 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"/>
                </svg>
            </div>

            <!-- ÁREA 2: INFORMAÇÕES DO POKÉMON (CLICÁVEL) - OCUPA O ESPAÇO RESTANTE -->
            <div class="flex items-center flex-grow min-w-0 p-1 cursor-pointer" onclick="window.Renderer.showPokemonStats('${p.name}', ${actualIndex})">
                <img src="../assets/sprites/pokemon/${p.id}_front.png" alt="${p.name}" class="w-16 h-16 sm:w-20 sm:h-20 mr-2 flex-shrink-0">
                <div class="flex flex-col min-w-0">
                    <div class="font-bold gba-font text-xs sm:text-sm truncate">
                      ${isFavorite ? '<span class="text-yellow-500">⭐</span> ' : ''}${window.Utils.getPokemonDisplayName(p)} ${isCurrentActive ? '<span class="text-[8px] text-green-600">(ATUAL)</span>' : ''}
                    </div>
                    <div class="text-[8px] sm:text-xs gba-font flex flex-col sm:flex-row sm:space-x-2">
                      <span>(Nv. ${p.level})</span>
                      <span>HP: ${p.currentHp}/${p.maxHp}</span>
                      ${p.types && p.types.length > 0 ? `<span class="text-[8px]">${p.types.map(t => window.Utils.formatName(t)).join('/')}</span>` : ''}
                      <div class="p-2 flex items-center w-full mt-1 ml-4 sm:ml-20">
                        <span class="gba-font text-[8px] mr-1 text-gray-700">EXP</span>
                        <div class="w-full bg-gray-300 h-1.5 rounded-full border border-gray-500">
                            <div class="h-1.5 rounded-full bg-blue-500 transition-all duration-500" style="width: ${expPercent}%;"></div>
                        </div>
                        <span class="gba-font text-[8px] ml-2 text-gray-700">${Math.floor(expPercent)}%</span>
                      </div>
                    </div>
                </div>
            </div>
            
            <!-- NOVO: ÁREA 3: BOTÃO DE FAVORITAR -->
            <div class="flex-shrink-0 ml-2" onclick="event.stopPropagation(); window.GameLogic.toggleFavoritePokemon(${actualIndex}); setTimeout(() => window.Renderer.showScreen('pokemonList'), 100);">
              <button class="p-2 text-yellow-500 hover:text-yellow-600 transition-colors ${isFavorite ? 'opacity-100' : 'opacity-30 hover:opacity-60'}" title="${isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                </svg>
              </button>
            </div>
        </div>
    `;
      })
      .join("");

    // NOVO: Função global para filtrar
    window.filterPokemonList = function(newSearch, newType, newFavorite) {
      const filters = window.currentPokemonListFilters;
      if (newSearch !== undefined) filters.search = newSearch;
      if (newType !== undefined) filters.type = newType;
      if (newFavorite !== undefined) filters.favorite = newFavorite;
      window.Renderer.showScreen('pokemonList');
    };

    const actionBanner = pendingSupportItem
      ? `<div class="gba-font text-xs text-center text-indigo-700 bg-indigo-100 border border-indigo-300 rounded-md px-3 py-2 mb-3">
          Selecione um Pokémon para usar <strong>${window.Utils.formatName(
            pendingSupportItem
          )}</strong>.
        </div>`
      : "";

    // NOVO: Cria HTML dos filtros
    const filtersHtml = `
      <div class="mb-4 flex-shrink-0 space-y-2">
        <div class="flex flex-col sm:flex-row gap-2">
          <input type="text" 
                 id="pokemonSearchInput" 
                 value="${filters.search || ''}" 
                 placeholder="Buscar por nome..." 
                 oninput="window.filterPokemonList(this.value, undefined, undefined)"
                 class="flex-1 p-2 border-2 border-gray-800 rounded gba-font text-sm bg-white shadow-inner">
          <select id="pokemonTypeFilter" 
                  onchange="window.filterPokemonList(undefined, this.value, undefined)"
                  class="flex-1 sm:flex-initial sm:w-32 p-2 border-2 border-gray-800 rounded gba-font text-sm bg-white shadow-inner">
            <option value="all" ${filters.type === 'all' ? 'selected' : ''}>TODOS OS TIPOS</option>
            ${uniqueTypes.map(type => 
              `<option value="${type}" ${filters.type === type ? 'selected' : ''}>${window.Utils.formatName(type)}</option>`
            ).join('')}
          </select>
          <select id="pokemonFavoriteFilter" 
                  onchange="window.filterPokemonList(undefined, undefined, this.value)"
                  class="flex-1 sm:flex-initial sm:w-36 p-2 border-2 border-gray-800 rounded gba-font text-sm bg-white shadow-inner">
            <option value="all" ${filters.favorite === 'all' ? 'selected' : ''}>TODOS</option>
            <option value="favorite" ${filters.favorite === 'favorite' ? 'selected' : ''}>⭐ FAVORITOS</option>
            <option value="not-favorite" ${filters.favorite === 'not-favorite' ? 'selected' : ''}>NÃO FAVORITOS</option>
          </select>
        </div>
        ${(filters.search || filters.type !== 'all' || filters.favorite !== 'all') ? `
          <button onclick="window.currentPokemonListFilters = { search: '', type: 'all', favorite: 'all' }; window.Renderer.showScreen('pokemonList');" 
                  class="w-full p-2 border-2 border-gray-600 rounded gba-font text-xs bg-gray-200 hover:bg-gray-300">
            Limpar Filtros
          </button>
        ` : ''}
      </div>
    `;

    const content = `
      <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">SEUS POKÉMONS</div>
      ${actionBanner}
      ${filtersHtml}
      <div class="pokemon-list-container flex-grow overflow-y-auto border border-gray-400 p-2 mb-4 bg-white">
        ${pokemonHtml || '<p class="text-center text-gray-500 gba-font">Nenhum Pokémon encontrado com os filtros atuais.</p>'}
      </div>
      <button onclick="window.Renderer.showScreen('battleTeam')" class="gba-button bg-blue-500 hover:bg-blue-600 w-full mb-2 flex-shrink-0">
        <i class="fa-solid fa-users mr-2"></i>Gerenciar Equipe de Batalha
      </button>
      <button onclick="window.Renderer.showScreen('managePokemon')" class="gba-button bg-cyan-500 hover:bg-cyan-600 w-full mb-2 flex-shrink-0">Gerenciar Pokémons</button>
      <button onclick="window.Renderer.showScreen('pokemonMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
    `;
    window.Renderer.renderGbaCard(content);
  },

  renderManagePokemon: async function () {
    const pokemonArray = window.gameState.profile.pokemon;
    const evolutionCost = window.GameConfig.EVOLUTION_COST;
    const requiredExp = 1000; // Nova regra: 1000 EXP

    // Loading inicial
    const loadingContent = `
      <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">GERENCIAR POKÉMONS</div>
      <div id="manage-pokemon-list" class="flex-grow overflow-y-auto border border-gray-400 p-4 mb-4 bg-white flex flex-col justify-center items-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
        <p class="gba-font text-xs mt-4 text-gray-600">Verificando evoluções (PokéAPI)...</p>
      </div>
      <button onclick="window.Renderer.showScreen('pokemonList')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
    `;
    window.Renderer.renderGbaCard(loadingContent);

    const pokemonHtmlPromises = pokemonArray.map(async (p, index) => {
      const isCurrentlyActive = index === 0;
      const canRelease = pokemonArray.length > 1;

      // NOVO: Verifica se é ramificada antes de buscar a próxima evolução linear
      const isBranched = window.BRANCHED_RULES?.[String(p.id)];
      let nextEvolutionName = null;
      if (!isBranched) {
        nextEvolutionName = await window.PokeAPI.fetchNextEvolution(p.id);
      }

      // O Pokémon é de Evolução Máxima se não for ramificado E não houver próxima evolução linear
      const isMaxEvolution = !isBranched && nextEvolutionName === null;

      // NOVO: Sistema de evolução baseado em nível e doces
      const evolutionReqs = window.GameLogic.getEvolutionRequirements(p.level);
      const pokemonCandy = window.GameLogic.getPokemonCandy(p.id);
      const hasLevel = evolutionReqs && p.level >= evolutionReqs.level;
      const hasCandy = evolutionReqs && pokemonCandy >= evolutionReqs.candy;

      // A condição para evoluir (ou ver opções) é: NÃO é max evolution E tem recursos
      const canEvolve = !isMaxEvolution && hasLevel && hasCandy;

      let evolveButtonText = "Evoluir";
      let evolveButtonClass = "bg-blue-500 hover:bg-blue-600";

      if (isMaxEvolution) {
        evolveButtonText = "Evolução Máxima";
        evolveButtonClass = "bg-gray-400 cursor-not-allowed";
      } else if (isBranched) {
        evolveButtonText = "Ver Evoluções";
        evolveButtonClass = "bg-yellow-500 hover:bg-yellow-600";
      } else if (!evolutionReqs) {
        evolveButtonText = `Nv. ${p.level < 16 ? 16 : p.level < 22 ? 22 : 35} necessário`;
        evolveButtonClass = "bg-gray-400 cursor-not-allowed";
      } else if (!hasLevel) {
        evolveButtonText = `Falta nível (Nv. ${evolutionReqs.level})`;
        evolveButtonClass = "bg-gray-400 cursor-not-allowed";
      } else if (!hasCandy) {
        evolveButtonText = `Falta doce (${evolutionReqs.candy - pokemonCandy})`;
        evolveButtonClass = "bg-gray-400 cursor-not-allowed";
      }
      const isDisabledEvolve = !canEvolve && !isMaxEvolution;

      // Ação do botão: Se for ramificado, abre o modal. Senão, inicia a evolução direta.
      const evolveAction = isBranched
        ? `window.RendererPokemon.showBranchedEvolutionOptions(${index})`
        : `window.GameLogic.evolvePokemon(${index})`;


      const useButtonText = isCurrentlyActive ? "ATIVO (ATUAL)" : "USAR";
      const isDisabledUse = isCurrentlyActive;
      const useButtonClass = isCurrentlyActive
        ? "bg-green-600 cursor-not-allowed opacity-70"
        : "bg-green-500 hover:bg-green-600";

      return `
        <div class="flex flex-col sm:flex-row items-center justify-between p-2 border-b border-gray-300 flex-shrink-0 space-y-2 sm:space-y-0">
          <div class="flex items-center w-full sm:w-1/2">
            <img src="${p.sprite}" alt="${p.name}" class="w-10 h-10 mr-2 flex-shrink-0">
            <div class="flex-grow min-w-0">
              <div class="font-bold gba-font break-words text-xs">${window.Utils.getPokemonDisplayName(p)} (Nv. ${p.level}) ${isCurrentlyActive ? '<span class="text-[8px] text-green-600">(ATUAL)</span>' : ""}</div>
              <div class="text-[8px] gba-font">HP: ${p.currentHp}/${p.maxHp} | Doces: ${pokemonCandy}${evolutionReqs ? ` (Necessário: ${evolutionReqs.candy} no Nv. ${evolutionReqs.level})` : ''}</div>
            </div>
          </div>
          <div class="flex space-x-2 w-full sm:w-1/2 justify-end">
            <button onclick="${isDisabledUse ? "" : `window.GameLogic.setPokemonAsActive(${index})`}"
                    class="gba-button text-xs w-1/4 h-12 ${useButtonClass}"
                    ${isDisabledUse ? "disabled" : ""}>
              ${useButtonText}
            </button>
            <button onclick="${isDisabledEvolve ? "" : evolveAction}"
                    class="gba-button text-xs h-12 ${evolveButtonClass}"
                    ${isDisabledEvolve ? "disabled" : ""}>
              ${evolveButtonText}
            </button>
            <button onclick="${canRelease ? `window.GameLogic.releasePokemon(${index})` : ""}"
                    class="gba-button text-xs w-1/4 h-12 ${canRelease ? "bg-red-500 hover:bg-red-600" : "bg-gray-400 cursor-not-allowed"}"
                    ${!canRelease ? "disabled" : ""}>
              Soltar
            </button>
          </div>
        </div>
      `;
    });

    const pokemonHtmlArray = await Promise.all(pokemonHtmlPromises);
    const pokemonHtml = pokemonHtmlArray.join("");

    const finalContent = `
      <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">GERENCIAR POKÉMONS</div>
      <div class="flex-grow overflow-y-auto border border-gray-400 p-2 mb-4 bg-white">${pokemonHtml}</div>
      <button onclick="window.Renderer.showScreen('pokemonList')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
    `;
    window.Renderer.renderGbaCard(finalContent);
  },

  // NOVO: Função para renderizar a tela da Mochila (Adicionada para corrigir TypeError)
  renderBag: function (app) {
    const profile = window.gameState.profile;
    // Filtra itens com quantidade > 0 e ordena
    const items = (profile.items || []).filter(i => i.quantity > 0).sort((a, b) => {
      const aSupport = (a.healAmount > 0) || a.ppRestore;
      const bSupport = (b.healAmount > 0) || b.ppRestore;
      if (aSupport && !bSupport) return -1;
      if (!aSupport && bSupport) return 1;
      return a.name.localeCompare(b.name);
    });

    const hasSupportItem = items.some(i => (i.healAmount > 0) || i.ppRestore);

    const itemsHtml = items.map(item => {
      const isUsable = item.healAmount > 0 || item.ppRestore;
      const actionText = item.healAmount > 0 ? "Curar" : item.ppRestore ? "Recarregar PA" : "Detalhes";
      const isPokeball = item.name.toLowerCase().includes("ball");
      const itemConfig = window.GameConfig.SHOP_ITEMS.find(i => i.name === item.name);
      const spriteUrl = itemConfig ? itemConfig.spriteUrl : "";
      // Ação: Se for item de cura, leva para a tela de lista de Pokémons para seleção.
      // Isso permite que a GameLogic utilize o item no Pokémon escolhido.
      const useButton = isUsable
        ? `<button onclick="window.Renderer.showScreen('pokemonList', { action: 'useItem', item: '${item.name}' })" 
                        class="gba-button ${item.ppRestore ? "bg-purple-500 hover:bg-purple-600" : "bg-green-500 hover:bg-green-600"} w-full">
                        ${actionText}
                    </button>`
        : `<button disabled class="gba-button bg-gray-400 w-full cursor-not-allowed">
                        ${isPokeball ? "Apenas em batalha" : "Sem uso fora de batalha"}
                    </button>`;

      return `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 border-b border-gray-300 bg-white">
                    <div class="flex items-center flex-grow min-w-0">
                        <!-- Icone/Sprite do item, usando o URL do objeto item -->
                        <img src="${spriteUrl || 'https://placehold.co/40x40/cccccc/000?text=I'}" alt="${item.name}" class="w-10 h-10 mr-2 flex-shrink-0">
                        <div class="flex-grow min-w-0">
                            <div class="font-bold gba-font text-xs truncate">${item.name}</div>
                            <span class="gba-font text-[10px] sm:text-xs block">x${item.quantity} ${actionText}</span>
                        </div>
                    </div>
                    
                    <!-- Action Button (Use) -->
                    <div class="flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                        ${useButton}
                    </div>
                </div>
            `;
    }).join("");

    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">MOCHILA</div>
            <p class="text-center text-sm gba-font mb-4 flex-shrink-0 text-gray-600">
                ${hasSupportItem
        ? "Itens de cura e PA podem ser usados aqui. Pokébolas apenas em batalha."
        : "Sua mochila contém seus tesouros."
      }
            </p>
            <!-- flex-grow e overflow-y-auto para a lista de itens -->
            <div class="flex-grow overflow-y-auto border border-gray-400 p-2 mb-4 bg-gray-100 space-y-2">
            ${itemsHtml ||
      '<p class="text-center text-gray-500 gba-font p-4">Mochila vazia!</p>'
      }
            </div>
            <button onclick="window.Renderer.showScreen('pokemonMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    window.Renderer.renderGbaCard(content);
  },

  // NOVO: Função para renderizar a tela de seleção da equipe de batalha
  renderBattleTeam: function (app) {
    const profile = window.gameState.profile;
    const pokemonArray = profile.pokemon || [];
    const battleTeam = profile.battleTeam || [];
    const MAX_BATTLE_TEAM = 5;

    // Garante que battleTeam seja um array válido
    if (!Array.isArray(battleTeam)) {
      profile.battleTeam = [];
    }

    const pokemonHtml = pokemonArray
      .map((p, index) => {
        const isInTeam = battleTeam.includes(index);
        const canToggle = !isInTeam && battleTeam.length < MAX_BATTLE_TEAM;
        const isDisabled = !canToggle && !isInTeam;

        return `
          <div class="flex items-center justify-between p-2 border-b border-gray-300 ${isInTeam ? 'bg-blue-50 border-blue-300' : ''}">
            <div class="flex items-center flex-grow min-w-0">
              <img src="../assets/sprites/pokemon/${p.id}_front.png" alt="${p.name}" class="w-12 h-12 mr-2 flex-shrink-0">
              <div class="flex-grow min-w-0">
                <div class="font-bold gba-font text-xs truncate">
                  ${window.Utils.getPokemonDisplayName(p)} (Nv. ${p.level})
                  ${isInTeam ? '<span class="text-[8px] text-blue-600 ml-1">(NA EQUIPE)</span>' : ''}
                </div>
                <div class="text-[8px] gba-font">HP: ${p.currentHp}/${p.maxHp}</div>
              </div>
            </div>
            <button 
              onclick="window.GameLogic.toggleBattleTeamPokemon(${index})"
              class="gba-button ${isInTeam ? 'bg-red-500 hover:bg-red-600' : isDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'} text-xs px-3 py-1"
              ${isDisabled ? 'disabled' : ''}>
              ${isInTeam ? 'Remover' : 'Adicionar'}
            </button>
          </div>
        `;
      })
      .join("");

    const teamCount = battleTeam.length;
    const teamInfo = `
      <div class="mb-4 p-3 bg-blue-100 border-2 border-blue-300 rounded-lg">
        <div class="text-center gba-font text-sm font-bold text-blue-800">
          Equipe de Batalha: ${teamCount} / ${MAX_BATTLE_TEAM}
        </div>
        ${teamCount === 0 ? `
          <p class="text-center text-xs gba-font text-blue-600 mt-2">
            Selecione até ${MAX_BATTLE_TEAM} pokémons para sua equipe de batalha.
            Se nenhum for selecionado, os ${MAX_BATTLE_TEAM} primeiros pokémons serão usados.
          </p>
        ` : ''}
        ${teamCount >= MAX_BATTLE_TEAM ? `
          <p class="text-center text-xs gba-font text-green-600 mt-2">
            Equipe completa! Você pode remover pokémons para adicionar outros.
          </p>
        ` : ''}
      </div>
    `;

    const content = `
      <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">EQUIPE DE BATALHA</div>
      ${teamInfo}
      <div class="flex-grow overflow-y-auto border border-gray-400 p-2 mb-4 bg-white">
        ${pokemonHtml || '<p class="text-center text-gray-500 gba-font p-4">Você não tem Pokémons!</p>'}
      </div>
      <button onclick="window.Renderer.showScreen('pokemonList')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
    `;
    window.Renderer.renderGbaCard(content);
  },

  // NOVO: Função para exibir opções de evolução ramificada (Apenas mock para funcionar a navegação)
  showBranchedEvolutionOptions: function (pokemonIndex) {
    const pokemon = window.gameState.profile.pokemon[pokemonIndex];

    // Simplesmente abre um modal de erro/info por enquanto (o usuário não pediu a lógica de UI completa aqui)
    window.Utils.showModal("infoModal",
      `**Evolução Ramificada:** ${pokemon.name} tem múltiplas evoluções. Esta tela precisa de implementação completa para seleção.`
    );
  },

  // Dentro de export const RendererPokemon = { ... }
  showPokemonStats: async function showPokemonStats(pokemonName, pokemonIndex) {
    try {
      const self = RendererPokemon;

      // Estado atual (time e perfil)
      const team = window.gameState?.profile?.pokemon || [];
      const profile = window.gameState?.profile;
      const p = team[pokemonIndex];

      if (!p) {
        window.Utils.showModal("errorModal", "Pokémon inválido.");
        return;
      }

      // Cálculos de barra
      const expToNextLevel = window.Utils.calculateExpToNextLevel(p.level);
      const expPercent = Math.min(100, (p.exp / expToNextLevel) * 100);
      const hpPercent = Math.max(0, Math.min(100, (p.currentHp / p.maxHp) * 100));

      // Dados complementares (padrão showPokedexStats)
      const [pokemonData, speciesData, rawEvolutionChain] = await Promise.all([
        window.PokeAPI.fetchPokemonData(p.id, true),
        window.PokeAPI.fetchSpeciesData(p.id),
        window.PokeAPI.fetchEvolutionChainData(p.id),
      ]);

      if (!pokemonData || !speciesData) {
        window.Utils.showModal("errorModal", "Dados do Pokémon não encontrados!");
        return;
      }

      // Cadeia evolutiva com suporte a ramificações
      const currentPokemonIdString = String(p.id);
      const baseIdRaw = window.PokeAPI.REVERSE_BRANCHED_EVOS?.[currentPokemonIdString];
      const baseIdNum = baseIdRaw != null ? Number(baseIdRaw) : null;

      let evolutionChain = rawEvolutionChain || [];
      let isShowingFullBranch = false;

      if (baseIdNum && evolutionChain[0]?.id !== baseIdNum) {
        evolutionChain = [
          { id: baseIdNum, name: window.PokeAPI.idToName(baseIdNum) },
          ...evolutionChain,
        ];
      }

      if (baseIdNum) {
        const baseEvo = evolutionChain.find(e => e.id === baseIdNum);
        const currentEvo = evolutionChain.find(e => e.id === p.id);
        if (baseEvo && currentEvo) {
          evolutionChain = [baseEvo, currentEvo].filter(Boolean);
        }
      } else if (window.PokeAPI.BRANCHED_EVOS?.[currentPokemonIdString]) {
        isShowingFullBranch = true;
      }

      // Tipos, stats e golpes
      window.Utils.ensureMoveCounters(p);
      const moves = (p.moves && p.moves.length) ? p.moves : (pokemonData.moves || []);
      
      // NOVO: Renderiza ataques com PA individual e botão para usar Éter
      const hasEther = (profile?.items || []).some(
        (i) => i.name === "Éter" && i.ppRestore && i.quantity > 0
      );
      const etherQuantity = hasEther 
        ? (profile?.items || []).find((i) => i.name === "Éter" && i.ppRestore)?.quantity || 0
        : 0;
      
      const movesHtml = moves
        .map((m) => {
          const moveName = typeof m === "string" ? m : m.name || m;
          const movePA = window.Utils.getMovePA(p, moveName);
          const isSpecial = window.Utils.isSpecialMove(p, moveName);
          const moveFull = movePA.remaining >= movePA.max;
          const moveDisplayName = window.Utils.formatName(moveName);
          const escapedMoveName = moveName.replace(/'/g, "\\'").replace(/"/g, '\\"');
          
          // Escapa o nome do movimento para uso em onclick
          const moveId = `move-${pokemonIndex}-${moveName.replace(/[^a-z0-9]/gi, '-')}`;
          const etherBtnId = `ether-btn-${pokemonIndex}-${moveName.replace(/[^a-z0-9]/gi, '-')}`;
          
          return `
            <div class="flex items-center justify-between p-2 mb-2 bg-gray-50 rounded border border-gray-300">
              <div class="flex-grow">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold gba-font">${moveDisplayName}</span>
                  ${isSpecial ? '<span class="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded gba-font">ESPECIAL</span>' : ''}
                </div>
                <div class="text-xs gba-font text-gray-600 mt-1">
                  PA: <span class="${movePA.remaining === 0 ? 'text-red-600 font-bold' : movePA.remaining < movePA.max / 2 ? 'text-yellow-600' : 'text-green-600'}">${movePA.remaining}/${movePA.max}</span>
                </div>
              </div>
              ${hasEther && !moveFull ? `
                <button id="${etherBtnId}" 
                        data-pokemon-index="${pokemonIndex}"
                        data-move-name="${moveName}"
                        data-pokemon-name="${p.name}"
                        class="ether-btn gba-button bg-purple-500 hover:bg-purple-600 text-xs px-3 py-1 ml-2 flex-shrink-0"
                        title="Usar Éter (${etherQuantity} restantes)">
                  <i class="fa-solid fa-flask"></i> Éter
                </button>
              ` : moveFull ? `
                <span class="text-xs text-green-600 gba-font ml-2 flex-shrink-0">Cheio</span>
              ` : `
                <span class="text-xs text-gray-400 gba-font ml-2 flex-shrink-0">Sem Éter</span>
              `}
            </div>
          `;
        })
        .join("");

      const typesHtml = (pokemonData.types || [])
        .map(type => `<span class="bg-blue-300 text-blue-800 text-xs font-bold mr-1 px-2.5 py-0.5 rounded-full gba-font">${String(type).toUpperCase()}</span>`)
        .join("");

      const statsHtml = Object.entries(pokemonData.stats || {})
        .map(([stat, value]) => `
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs gba-font">${window.Utils.formatName(stat)}:</span>
          <span class="text-xs gba-font">${value}</span>
        </div>
      `).join("");

      const heightMeters = (speciesData.height / 10).toFixed(1);
      const weightKg = (speciesData.weight / 10).toFixed(1);

      // Render da cadeia evolutiva
      const pokedexSet = window.gameState?.profile?.pokedex;
      let evolutionItemsHtml = '';

      if (isShowingFullBranch) {
        const chain = (evolutionChain || []).slice();
        const baseEvo = chain.shift();
        const isBaseKnown = pokedexSet.has(baseEvo?.id);

        let baseHtml = `<div class="flex flex-col items-center flex-shrink-0 w-20">`;
        baseHtml += `<div onclick="window.Renderer.showPokedexStats(${baseEvo?.id}, ${!isBaseKnown})" class="cursor-pointer">`;
        baseHtml += self._renderEvoItem(baseEvo, baseEvo?.id, pokedexSet, p.id);
        baseHtml += `</div>`;
        baseHtml += `
        <div class="flex-shrink-0 flex flex-col items-center justify-center text-yellow-700 text-xs font-bold -mt-1 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-shuffle" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M0 3.5A.5.5 0 0 1 .5 3H4a.5.5 0 0 1 0 1H1.42l6.213 6.213A.5.5 0 0 1 7.404 11H4a.5.5 0 0 1 0-1h3.404l-6.214-6.213A.5.5 0 0 1 0 3.5M.5 11a.5.5 0 0 0 0 1H4a.5.5 0 0 0 0-1zm9.896-1.55a.5.5 0 0 0-.707 0l-3.2 3.2a.5.5 0 0 0 0 .707l3.2 3.2a.5.5 0 0 0 0 .707l3.2 3.2a.5.5 0 0 0 0 .707L9.42 13h1.08a2.5 2.5 0 0 0 2.5-2.5V8h1.5a.5.5 0 0 0 0-1H13v1.5A1.5 1.5 0 0 1 11.5 10H10.58l3.243-3.243A.5.5 0 0 0 14 6.5h-1.5A2.5 2.5 0 0 0 10 4V2.5a.5.5 0 0 0 0-1H11.5A1.5 1.5 0 0 1 13 2.5v1.5a.5.5 0 0 0 1 0V2.5a2.5 2.5 0 0 0-2.5-2.5H10.58z"/>
          </svg>
          RAMIFICA
        </div>
      `;
        baseHtml += `</div>`;

        const otherEvos = chain || [];
        const evosHtml = otherEvos
          .map(evo => {
            const isKnown = pokedexSet.has(evo.id);
            return `<div onclick="window.Renderer.showPokedexStats(${evo.id}, ${!isKnown})" class="cursor-pointer">${self._renderEvoItem(evo, evo?.id, pokedexSet, p.id)}</div>`;
          })
          .join('');

        evolutionItemsHtml = baseHtml + `
        <div class="flex flex-wrap justify-center items-start space-x-1 mt-2 w-full">
          ${otherEvos.length > 0 ? `<div class="text-3xl text-gray-400">⇩</div>` : ''} 
          <div class="flex flex-wrap justify-center items-start space-x-2 space-y-2 max-w-full">
            ${evosHtml}
          </div>
        </div>`;
      } else {
        evolutionItemsHtml = (evolutionChain || []).map((evo, evoIndex) => {
          let evoItem = '';
          if (evoIndex > 0) {
            evoItem += `
            <div class="flex-shrink-0 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#3b82f6" class="bi bi-arrow-right-short" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8"/>
              </svg>
            </div>
          `;
          }
          const isKnown = pokedexSet.has(evo.id);
          evoItem += `<div onclick="window.Renderer.showPokedexStats(${evo.id}, ${!isKnown})" class="cursor-pointer">${self._renderEvoItem(evo, evo?.id, pokedexSet, p.id)}</div>`;
          return evoItem;
        }).join('');
      }

      // Seção de cura (responsiva, botão sempre visível em mobile)
      window.Utils.ensureMoveCounters(p);
      const supportItems = (profile?.items || []).filter(
        (i) => i.quantity > 0 && (i.healAmount > 0 || i.ppRestore)
      );
      const canUseNow = supportItems.some((item) => {
        if (item.healAmount > 0) {
          return p.currentHp < p.maxHp;
        }
        if (item.ppRestore) {
          // NOVO: Verifica se algum movimento precisa de PA
          if (p.moves && p.moves.length > 0) {
            for (const move of p.moves) {
              const moveName = typeof move === "string" ? move : move.name || move;
              const movePA = window.Utils.getMovePA(p, moveName);
              if (movePA.remaining < movePA.max) {
                return true;
              }
            }
            return false;
          } else {
            // Fallback para sistema antigo
            return !(
              p.normalMoveRemaining >= p.normalMoveMaxUses &&
              p.specialMoveRemaining >= p.specialMoveMaxUses
            );
          }
        }
        return false;
      });
      const selectId = `healItemSelect-${pokemonIndex}`;
      const useBtnId = `healUseBtn-${pokemonIndex}`;

      const healOptions = supportItems.map(i => {
        const effect =
          i.healAmount > 0 ? `+${i.healAmount} HP` : "Recupera PA";
        return `<option value="${i.name}">${i.name} (${effect}) x${i.quantity}</option>`;
      }).join("");

      const healSection = `
      <div class="mt-2 p-2 border-t border-gray-400">
        <h3 class="font-bold gba-font text-sm mb-2 text-center text-green-700">ITENS DE CURA</h3>
        ${supportItems.length ? `
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select id="${selectId}" class="w-full sm:flex-grow p-1 border-2 border-gray-800 rounded gba-font text-xs bg-white shadow-inner">
              ${healOptions}
            </select>
            <button id="${useBtnId}"
                    class="w-full sm:w-auto flex-shrink-0 gba-button ${canUseNow ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'}"
                    ${canUseNow ? '' : 'disabled'}>
              Usar
            </button>
          </div>
          <p class="text-[10px] gba-font text-gray-600 mt-1 text-center sm:text-left">Poções recuperam HP. Éteres recarregam PAs.</p>
        ` : `
          <div class="text-center text-[10px] gba-font text-gray-600">Sem itens de suporte disponíveis.</div>
          <button onclick="window.Utils.hideModal('pokemonStatsModal'); window.Renderer?.showScreen?.('bag')"
                  class="gba-button bg-blue-500 hover:bg-blue-600 w-full mt-2">
            Ir à Mochila
          </button>
        `}
      </div>
    `;

      const displayName = window.Utils.getPokemonDisplayName(p);
      const nicknameSection = p.nickname ? `<p class="text-xs gba-font text-gray-600 mt-1">Apelido: <strong>${p.nickname}</strong> | Nome original: ${p.name}</p>` : '';
      
      // Montagem do modal
      const modalContent = `
      <div class="text-xl font-bold text-gray-800 gba-font mb-2 text-center flex-shrink-0">
        #${p.id.toString().padStart(3, "0")} - ${displayName} (Nv. ${p.level})
      </div>
      ${nicknameSection}
      <button onclick="window.Renderer.showRenamePokemonModal(${pokemonIndex})" class="gba-button bg-purple-500 hover:bg-purple-600 w-full mb-2 mt-2 flex-shrink-0">
        <i class="fa-solid fa-pen mr-2"></i>Renomear Pokémon
      </button>

      <img src="${p.sprite || `../assets/sprites/pokemon/${p.id}_front.png`}" alt="${displayName}" class="w-32 h-32 mx-auto mb-2 flex-shrink-0">
      <div class="text-center mb-2 flex-shrink-0">${typesHtml}</div>

      <div class="text-left gba-font text-xs flex-shrink-0 border-b border-gray-400 pb-2 mb-2">
        <p class="text-[8px] sm:text-xs"><strong>Altura:</strong> ${heightMeters} m | <strong>Peso:</strong> ${weightKg} kg</p>
        <p class="mt-2 text-[8px] sm:text-xs text-justify"><strong>DESCRIÇÃO:</strong> ${speciesData.description}</p>
      </div>

      ${p.captureDate || p.captureBall ? `
      <div class="p-2 bg-blue-50 rounded-lg border border-blue-300 mb-2 flex-shrink-0">
        <h3 class="font-bold gba-font text-xs mb-1 text-center text-blue-700">INFORMAÇÕES DE CAPTURA</h3>
        ${p.captureDate ? `
          <p class="text-[8px] sm:text-xs gba-font text-gray-700 mb-1">
            <strong>📅 Data de Captura:</strong> ${new Date(p.captureDate).toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        ` : ''}
        ${p.captureBall ? `
          <p class="text-[8px] sm:text-xs gba-font text-gray-700">
            <strong> Pokébola:</strong> ${p.captureBall}
          </p>
        ` : ''}
      </div>
      ` : ''}

      <div class="p-2 bg-gray-100 rounded-lg border border-gray-300 mb-2">
        <div class="flex items-center justify-between">
          <span class="gba-font text-[10px] text-gray-700">HP</span>
          <span class="gba-font text-[10px] text-gray-700">${p.currentHp}/${p.maxHp}</span>
        </div>
        <div class="w-full bg-gray-300 h-2 rounded-full border border-gray-500">
          <div class="h-2 rounded-full ${p.currentHp > 0 ? 'bg-green-500' : 'bg-red-500'}" style="width: ${hpPercent}%;"></div>
        </div>

        <div class="flex items-center justify-between mt-2">
          <span class="gba-font text-[10px] text-gray-700">EXP</span>
          <span class="gba-font text-[10px] text-gray-700">${p.exp}/${expToNextLevel}</span>
        </div>
        <div class="w-full bg-gray-300 h-2 rounded-full border border-gray-500">
          <div class="h-2 rounded-full bg-blue-500" style="width: ${expPercent}%;"></div>
        </div>
      </div>

      ${healSection}

      <div class="mt-2 p-2 border-t border-gray-400 flex-shrink-0">
        <h3 class="font-bold gba-font text-sm mb-2 text-center text-blue-700">CADEIA EVOLUTIVA</h3>
        <div class="flex ${isShowingFullBranch ? 'flex-col items-center' : ' justify-center items-center'} p-2 bg-gray-100 rounded-lg space-x-1">
          ${evolutionItemsHtml}
        </div>
      </div>

      <div class="p-2 flex-grow overflow-y-auto">
        <h3 class="font-bold gba-font text-sm mb-2">Estatísticas Base:</h3>
        ${statsHtml}
        <h3 class="font-bold gba-font text-sm mb-2 mt-4">Ataques:</h3>
        <div class="space-y-1">
          ${movesHtml}
        </div>
        ${hasEther ? `
          <p class="text-[10px] gba-font text-gray-600 mt-2 text-center">
            <i class="fa-solid fa-flask"></i> Você tem ${etherQuantity} Éter(s). Use para restaurar PA de um ataque específico.
          </p>
        ` : ''}
      </div>

      <button onclick="window.Utils.hideModal('pokemonStatsModal')" class="gba-button bg-gray-500 hover:bg-gray-600 mt-4 w-full flex-shrink-0">Fechar</button>
    `;

      const modal = document.getElementById("pokemonStatsModal");
      if (!modal) return;
      const modalBody = modal.querySelector(".modal-body");
      if (!modalBody) return;

      modalBody.classList.add("flex", "flex-col", "h-full");
      modalBody.innerHTML = modalContent;
      modal.classList.remove("hidden");

      // Handler do botão Usar (sem inline onclick)
      const useBtn = modal.querySelector(`#${useBtnId}`);
      if (useBtn) {
        useBtn.addEventListener('click', () => {
          try {
            const select = modal.querySelector(`#${selectId}`);
            if (!select) {
              window.Utils.showModal('errorModal', 'Seletor de item não encontrado.');
              return;
            }

            const itemName = select.value;
            window.GameLogic.useItem(itemName, pokemonIndex);

            setTimeout(() => {
              const refreshed = window.gameState.profile.pokemon[pokemonIndex];
              if (refreshed) {
                showPokemonStats(refreshed.name, pokemonIndex);
              }
            }, 150);
          } catch (err) {
            console.error('Erro ao usar item de cura:', err);
            window.Utils.showModal('errorModal', 'Falha ao usar item.');
          }
        });
      }

      // NOVO: Handlers para botões de Éter em cada ataque
      const etherButtons = modal.querySelectorAll('.ether-btn');
      etherButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          try {
            const pokemonIdx = parseInt(btn.getAttribute('data-pokemon-index'));
            const moveName = btn.getAttribute('data-move-name');
            const pokemonName = btn.getAttribute('data-pokemon-name');
            
            if (isNaN(pokemonIdx) || !moveName) {
              window.Utils.showModal('errorModal', 'Dados inválidos.');
              return;
            }

            const success = window.GameLogic.useEtherOnMove(pokemonIdx, moveName);
            
            if (success) {
              // Fecha o modal de informação após 1.5 segundos e recarrega os stats
              setTimeout(() => {
                window.Utils.hideModal('infoModal');
                const refreshed = window.gameState.profile.pokemon[pokemonIdx];
                if (refreshed) {
                  showPokemonStats(refreshed.name || pokemonName, pokemonIdx);
                }
              }, 1500);
            }
          } catch (err) {
            console.error('Erro ao usar Éter:', err);
            window.Utils.showModal('errorModal', 'Falha ao usar Éter.');
          }
        });
      });
    } catch (e) {
      console.error('Erro ao abrir stats do Pokémon:', e);
      window.Utils.showModal('errorModal', 'Não foi possível abrir os detalhes.');
    }
  },


  showPokedexStats: async function (pokemonId, isSilhouette = false) {

    // Define a ação de voltar baseada na região atual 
    const currentRegionId = window.currentPokedexFilters.region;
    // Ação que fecha o modal E navega (retorna à lista de região ou ao grid da região atual)
    const returnAction = currentRegionId
      ? `window.Utils.hideModal('pokemonStatsModal'); window.Renderer.showScreen('pokedex', { region: '${currentRegionId}' })`
      : `window.Utils.hideModal('pokemonStatsModal'); window.Renderer.showScreen('pokedex', { region: null })`;

    // 1. LÓGICA DE SILHUETA
    if (isSilhouette) {
      const baseId = window.PokeAPI.REVERSE_BRANCHED_EVOS?.[String(pokemonId)];
      const basePokemonName = baseId ? window.Utils.formatName(window.POKE_DATA?.[String(baseId)]?.name || window.PokeAPI.idToName(baseId)) : null;

      let extraMessage = '';
      if (basePokemonName) {
        extraMessage = `<p class="mt-2 text-xs">Deriva de: <strong>${basePokemonName}</strong></p>`;
      }

      const modalContent = `
            <div class="text-xl font-bold text-gray-800 gba-font mb-4 text-center flex-shrink-0">
                ???
            </div>
            <img src="https://placehold.co/128x128/000000/fff?text=?" alt="Desconhecido" class="w-32 h-32 mx-auto mb-4 flex-shrink-0">
            <div class="text-left gba-font text-xs flex-shrink-0 p-4">
                <p>Este Pokémon ainda não foi capturado.</p>
                <p class="mt-2">Continue explorando para encontrá-lo!</p>
                <p class="mt-2 text-sm">#${pokemonId
          .toString()
          .padStart(3, "0")}</p>
                ${extraMessage}
            </div>
            <button onclick="${returnAction}" class="gba-button bg-gray-500 hover:bg-gray-600 mt-4 w-full flex-shrink-0">Voltar</button>
        `;

      const modal = document.getElementById("pokemonStatsModal");
      if (modal) {
        const modalBody = modal.querySelector(".modal-body");
        if (modalBody) {
          modalBody.classList.add("flex", "flex-col", "h-full");
          modalBody.innerHTML = modalContent;
          modal.classList.remove("hidden");
        }
      }
      return;
    }

    // 2. LÓGICA DO POKÉMON CONHECIDO

    let [pokemonData, speciesData, rawEvolutionChain] = await Promise.all([
      window.PokeAPI.fetchPokemonData(pokemonId, true),
      window.PokeAPI.fetchSpeciesData(pokemonId),
      window.PokeAPI.fetchEvolutionChainData(pokemonId),
    ]);

    if (!pokemonData || !speciesData) {
      window.Utils.showModal("errorModal", "Dados do Pokémon não encontrados!");
      return;
    }

    const currentPokemonIdString = String(pokemonId);
    // Prioridade 1: É uma forma derivada de ramificação (Ex: Vaporeon)
    const baseIdRaw = window.PokeAPI.REVERSE_BRANCHED_EVOS?.[currentPokemonIdString]; // pode ser string/undefined
    const baseIdNum = baseIdRaw != null ? Number(baseIdRaw) : null; // normaliza ou mantém null
    const baseId = baseIdNum;
    if (baseIdNum && rawEvolutionChain[0]?.id !== baseIdNum) {
      rawEvolutionChain = [
        { id: baseIdNum, name: window.PokeAPI.idToName(baseIdNum) },
        ...rawEvolutionChain,
      ];
    }

    // --- FILTRAGEM DA CADEIA DE EVOLUÇÃO (LÓGICA DE PRIORIDADE) ---
    let evolutionChain = rawEvolutionChain;


    let isBaseOfBranch = false;
    let isShowingFullBranch = false;



    if (baseId) {
      console.log("entrou no baseID: ");
      console.log(baseId);
      // Mostra a cadeia curta: [Base -> Atual]
      const baseEvo = rawEvolutionChain.find(e => e.id === baseId);
      const currentEvo = rawEvolutionChain.find(e => e.id === pokemonId);
      console.log(rawEvolutionChain);
      console.log("BaseEvo: ");
      console.log(baseEvo);
      console.log("CurrentEvo:");
      console.log(currentEvo);
      if (baseEvo && currentEvo) {
        console.log("entrou no baseEvo e currentEvo");
        evolutionChain = [baseEvo, currentEvo].filter(Boolean);

        console.log(evolutionChain);
      }
    } else {
      console.log("entrou no else do baseID");
      console.log(currentPokemonIdString);
      console.log(window.PokeAPI.BRANCHED_EVOS);
      console.log(window.PokeAPI.BRANCHED_EVOS?.[currentPokemonIdString]);
      console.log(window.PokeAPI.REVERSE_BRANCHED_EVOS);
      // Prioridade 2: É a forma base de uma ramificação (Ex: Eevee, Tyrogue).
      if (window.PokeAPI.BRANCHED_EVOS?.[currentPokemonIdString]) {
        console.log("entrou if do BRANCHED_EVOS");
        // Mostra A CADEIA COMPLETA.
        evolutionChain = rawEvolutionChain;
        isShowingFullBranch = true;
        isBaseOfBranch = true;
      }
      // Se não for ramificado (Prioridade 3), usa a rawEvolutionChain completa (cadeia linear).
    }
    // --- FIM DA FILTRAGEM ---

    const movesHtml = pokemonData.moves
      .map((move) => `<li class="text-sm">${window.Utils.formatName(move)}</li>`)
      .join("");

    const typesHtml = pokemonData.types
      .map((type) => `<span class="bg-blue-300 text-blue-800 text-xs font-bold mr-1 px-2.5 py-0.5 rounded-full gba-font">${type.toUpperCase()}</span>`)
      .join("");

    const statsHtml = Object.entries(pokemonData.stats)
      .map(([stat, value]) => `
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs gba-font">${window.Utils.formatName(stat)}:</span>
          <span class="text-xs gba-font">${value}</span>
        </div>
      `).join("");

    const heightMeters = (speciesData.height / 10).toFixed(1);
    const weightKg = (speciesData.weight / 10).toFixed(1);

    const pokedexSet = window.gameState.profile.pokedex;
    let evolutionItemsHtml = '';

    if (isShowingFullBranch) {
      // Lógica para Pokémons base com múltiplas evoluções (Eevee, Tyrogue, etc.)
      const chain = evolutionChain.slice(); // ou [...evolutionChain]
      const baseEvo = chain.shift(); // Remove o Pokémon base da lista
      const otherEvolutions = chain;

      // Renderiza o Pokémon Base + Marcador
      let baseHtml = `<div class="flex flex-col items-center flex-shrink-0 w-20">`;
      baseHtml += `<div onclick="${returnAction}; window.Renderer.showPokedexStats(${baseEvo.id}, ${!pokedexSet.has(baseEvo.id)})" class="cursor-pointer">`;
      baseHtml += RendererPokemon._renderEvoItem(baseEvo, baseEvo.id, pokedexSet, pokemonData.id);
      baseHtml += `</div>`;
      baseHtml += `
            <div class="flex-shrink-0 flex flex-col items-center justify-center text-yellow-700 text-xs font-bold -mt-1 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-shuffle" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M0 3.5A.5.5 0 0 1 .5 3H4a.5.5 0 0 1 0 1H1.42l6.213 6.213A.5.5 0 0 1 7.404 11H4a.5.5 0 0 1 0-1h3.404l-6.214-6.213A.5.5 0 0 1 0 3.5M.5 11a.5.5 0 0 0 0 1H4a.5.5 0 0 0 0-1zm9.896-1.55a.5.5 0 0 0-.707 0l-3.2 3.2a.5.5 0 0 0 0 .707l3.2 3.2a.5.5 0 0 0 .707-.707L9.42 13h1.08a2.5 2.5 0 0 0 2.5-2.5V8h1.5a.5.5 0 0 0 0-1H13v1.5A1.5 1.5 0 0 1 11.5 10H10.58l3.243-3.243A.5.5 0 0 0 14 6.5h-1.5A2.5 2.5 0 0 0 10 4V2.5a.5.5 0 0 0 0-1H11.5A1.5 1.5 0 0 1 13 2.5v1.5a.5.5 0 0 0 1 0V2.5a2.5 2.5 0 0 0-2.5-2.5H10.58z"/>
                </svg>
                RAMIFICA
            </div>
        `;
      baseHtml += `</div>`;

      // Renderiza as Evoluções abaixo (em um layout flexível)
      const evosHtml = otherEvolutions.map(evo => {
        const isKnown = pokedexSet.has(evo.id);
        // CORREÇÃO: Usa RendererPokemon. para chamar o método
        return `<div onclick="${returnAction}; window.Renderer.showPokedexStats(${evo.id}, ${!isKnown})" class="cursor-pointer">${RendererPokemon._renderEvoItem(evo, evo.id, pokedexSet, pokemonData.id)}</div>`;
      }).join('');

      evolutionItemsHtml = baseHtml + `
        <div class="flex flex-wrap justify-center items-start space-x-1 mt-2 w-full">
            ${otherEvolutions.length > 0 ? `<div class="text-3xl text-gray-400">⇩</div>` : ''} 
            <div class="flex flex-wrap justify-center items-start space-x-2 space-y-2 max-w-full">
                ${evosHtml}
            </div>
        </div>`;

    } else {
      // Lógica para Pokémons lineares ou evoluções derivadas ramificadas (Cadeia Curta)
      evolutionItemsHtml = evolutionChain.map((evo, evoIndex) => {
        const evoIdString = String(evo.id);
        const isEvoBaseOfBranch = window.PokeAPI.BRANCHED_EVOS?.[evoIdString];

        let evoItem = '';

        // 1. Adiciona a Seta
        if (evoIndex > 0) {
          evoItem += `
                    <div class="flex-shrink-0 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#3b82f6" class="bi bi-arrow-right-short" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8"/>
                        </svg>
                    </div>
                `;
        }

        // 2. Renderiza o Pokémon e torna-o clicável
        const isKnown = pokedexSet.has(evo.id);
        // CORRIGIDO: Ação de clique
        evoItem += `<div onclick="${returnAction}; window.Renderer.showPokedexStats(${evo.id}, ${!isKnown})" class="cursor-pointer">`;
        // CORREÇÃO: Usa RendererPokemon. para chamar o método
        evoItem += RendererPokemon._renderEvoItem(evo, evo.id, pokedexSet, pokemonData.id);
        evoItem += `</div>`;

        // 3. Adiciona o Marcador de Ramificação (se for o base em uma cadeia curta)
        // Esta condição só ocorre para Vaporeon (baseId existe) mostrando [Eevee -> Vaporeon]
        if (isEvoBaseOfBranch && evo.id === baseId) {
          evoItem += `
                    <div class="flex-shrink-0 flex flex-col items-center justify-center text-yellow-700 text-xs font-bold -ml-2 -mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-shuffle" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M0 3.5A.5.5 0 0 1 .5 3H4a.5.5 0 0 1 0 1H1.42l6.213 6.213A.5.5 0 0 1 7.404 11H4a.5.5 0 0 1 0-1h3.404l-6.214-6.213A.5.5 0 0 1 0 3.5M.5 11a.5.5 0 0 0 0 1H4a.5.5 0 0 0 0-1zm9.896-1.55a.5.5 0 0 0-.707 0l-3.2 3.2a.5.5 0 0 0 0 .707l3.2 3.2a.5.5 0 0 0 .707-.707L9.42 13h1.08a2.5 2.5 0 0 0 2.5-2.5V8h1.5a.5.5 0 0 0 0-1H13v1.5A1.5 1.5 0 0 1 11.5 10H10.58l3.243-3.243A.5.5 0 0 0 14 6.5h-1.5A2.5 2.5 0 0 0 10 4V2.5a.5.5 0 0 0 0-1H11.5A1.5 1.5 0 0 1 13 2.5v1.5a.5.5 0 0 0 1 0V2.5a2.5 2.5 0 0 0-2.5-2.5H10.58z"/>
                        </svg>
                        RAMIFICA
                    </div>
                `;
        }

        return evoItem;
      }).join('');
    }


    const evolutionSection = `
      <div class="mt-4 p-2 border-t border-gray-400 flex-shrink-0">
        <h3 class="font-bold gba-font text-sm mb-2 text-center text-blue-700">CADEIA EVOLUTIVA</h3>
        <div class="flex ${isShowingFullBranch ? 'flex-col items-center' : ' justify-center items-center'} p-2 bg-gray-100 rounded-lg space-x-1">
          ${evolutionItemsHtml}
        </div>
      </div>
    `;

    const modalContent = `
      <div class="text-xl font-bold text-gray-800 gba-font mb-4 text-center flex-shrink-0">
        #${pokemonData.id.toString().padStart(3, "0")} - ${pokemonData.name}
      </div>
      <img src="${pokemonData.sprite}" alt="${pokemonData.name}" class="w-32 h-32 mx-auto mb-4 flex-shrink-0">
      <div class="text-center mb-2 flex-shrink-0">${typesHtml}</div>
      <div class="text-left gba-font text-xs flex-shrink-0 border-b border-gray-400 pb-2 mb-2">
        <p class="text-[8px] sm:text-xs"><strong>Altura:</strong> ${heightMeters} m | <strong>Peso:</strong> ${weightKg} kg</p>
        <p class="mt-2 text-[8px] sm:text-xs text-justify"><strong>DESCRIÇÃO:</strong> ${speciesData.description}</p>
      </div>
      ${evolutionSection}
      <div class="p-2 flex-grow overflow-y-auto">
        <h3 class="font-bold gba-font text-sm mb-2">Estatísticas Base:</h3>
        ${statsHtml}
        <h3 class="font-bold gba-font text-sm mb-2 mt-4">Ataques Conhecidos:</h3>
        <ul class="list-disc list-inside gba-font text-xs">
          ${movesHtml}
        </ul>
      </div>
      
      <!-- BOTÃO DE VOLTAR CORRIGIDO -->
      <button onclick="${returnAction}" class="gba-button bg-gray-500 hover:bg-gray-600 mt-4 w-full flex-shrink-0">Voltar</button>
    `;

    const modal = document.getElementById("pokemonStatsModal");
    if (modal) {
      const modalBody = modal.querySelector(".modal-body");
      if (modalBody) {
        modalBody.classList.add("flex", "flex-col", "h-full");
        modalBody.innerHTML = modalContent;
        modal.classList.remove("hidden");
      }
    }
  },

  // NOVO: Função para mostrar modal de renomear pokémon
  showRenamePokemonModal: function (pokemonIndex) {
    const pokemon = window.gameState.profile.pokemon[pokemonIndex];
    if (!pokemon) {
      window.Utils.showModal("errorModal", "Pokémon inválido.");
      return;
    }

    const currentNickname = pokemon.nickname || "";
    const modalId = "renamePokemonModal";
    
    // Cria o modal se não existir
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement("div");
      modal.id = modalId;
      modal.className = "fixed inset-0 bg-black bg-opacity-50 hidden flex justify-center items-center z-50";
      modal.innerHTML = `
        <div class="bg-gray-100 border-4 border-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-sm">
          <div class="text-lg font-bold text-gray-800 gba-font mb-4 text-center">RENOMEAR POKÉMON</div>
          <div class="modal-body"></div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const modalBody = modal.querySelector(".modal-body");
    const displayName = window.Utils.getPokemonDisplayName(pokemon);
    
    modalBody.innerHTML = `
      <p class="text-sm gba-font text-gray-700 mb-3 text-center">
        Renomear <strong>${displayName}</strong><br>
        <span class="text-xs">Nome original: ${pokemon.name}</span>
      </p>
      <input type="text" 
             id="pokemonNicknameInput" 
             value="${currentNickname}" 
             placeholder="Digite um apelido (máx. 20 caracteres)" 
             maxlength="20"
             class="w-full p-2 border-2 border-gray-800 rounded gba-font text-sm mb-3">
      <div class="flex gap-2">
        <button onclick="window.Renderer.confirmRenamePokemon(${pokemonIndex})" 
                class="gba-button bg-green-500 hover:bg-green-600 flex-1">
          Salvar
        </button>
        ${currentNickname ? `
          <button onclick="window.GameLogic.renamePokemon(${pokemonIndex}, '')" 
                  class="gba-button bg-red-500 hover:bg-red-600 flex-1">
            Remover Apelido
          </button>
        ` : ''}
        <button onclick="window.Utils.hideModal('renamePokemonModal')" 
                class="gba-button bg-gray-500 hover:bg-gray-600 flex-1">
          Cancelar
        </button>
      </div>
    `;
    
    modal.classList.remove("hidden");
    
    // Foca no input e seleciona o texto
    setTimeout(() => {
      const input = document.getElementById("pokemonNicknameInput");
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  },

  // NOVO: Função para confirmar renomeação do pokémon
  confirmRenamePokemon: function (pokemonIndex) {
    const input = document.getElementById("pokemonNicknameInput");
    if (!input) {
      window.Utils.showModal("errorModal", "Input não encontrado.");
      return;
    }
    
    const newNickname = input.value.trim();
    window.GameLogic.renamePokemon(pokemonIndex, newNickname);
    window.Utils.hideModal("renamePokemonModal");
    
    // Recarrega o modal de stats para mostrar o novo nome
    setTimeout(() => {
      const pokemon = window.gameState.profile.pokemon[pokemonIndex];
      if (pokemon) {
        window.Renderer.showPokemonStats(pokemon.name, pokemonIndex);
      }
    }, 300);
  },

  _useHealItemOnPokemon: function (pokemonIndex) {
    try {
      const modal = document.getElementById("pokemonStatsModal");
      const useBtn =
        modal?.querySelector(
          `button[onclick="RendererPokemon._useHealItemOnPokemon(${pokemonIndex})"]`
        ) || null;
      let select = null;
      if (useBtn) {
        const selectId = useBtn.getAttribute("data-select");
        if (selectId) {
          select = document.getElementById(selectId);
        }
      }
      if (!select) {
        select = document.getElementById("healItemSelect");
      }
      if (!select) {
        window.Utils.showModal(
          "errorModal",
          "Seletor de item não encontrado."
        );
        return;
      }

      const itemName = select.value;
      window.GameLogic.useItem(itemName, pokemonIndex);
      window.gameState.pendingSupportItem = null;
      window.GameLogic.useItem(itemName, pokemonIndex);
      window.gameState.pendingSupportItem = null;

      setTimeout(() => {
        const refreshed = window.gameState.profile.pokemon[pokemonIndex];
        if (refreshed) {
          RendererPokemon.showPokemonStats(refreshed.name, pokemonIndex);
        }
      }, 150);
    } catch (e) {
      console.error("Erro ao usar item de suporte:", e);
      window.Utils.showModal("errorModal", "Falha ao usar item.");
    }
  },

  _ensurePokedexCacheLoaded: async function () {
    const totalAvailable = window.GameConfig.POKEDEX_LIMIT;
    window.gameState.pokedexCache = window.gameState.pokedexCache || {};
    const cache = window.gameState.pokedexCache;

    let cacheUpdated = false;

    if (Object.keys(cache).length >= totalAvailable) {
      return;
    }

    const fetchPromises = [];
    for (let id = 1; id <= totalAvailable; id++) {
      const shouldFetch = !cache[id] || window.gameState.profile.pokedex.has(id);
      if (shouldFetch) {
        fetchPromises.push(
          window.PokeAPI.fetchPokemonData(id, true)
            .then((data) => {
              if (data && data.id) {
                if (!cache[data.id] || cache[data.id].name === null) {
                  cache[data.id] = { name: data.name, types: data.types };
                  cacheUpdated = true;
                }
              }
            })
            .catch((e) => console.error(`Falha ao buscar ID ${id} para cache:`, e))
        );
      }
    }

    if (fetchPromises.length > 0) {
      await Promise.allSettled(fetchPromises);

      if (cacheUpdated) {
        window.GameLogic.saveGameData();

        const currentScreen = window.gameState.currentScreen;
        const regionKey = window.currentPokedexFilters.region;

        if (currentScreen === 'pokedex' && regionKey) {
          const region = window.GameConfig.POKEDEX_REGIONS.find(r => r.id === regionKey);
          if (region) {
            const filtersToUse = window.currentPokedexFilters;
            setTimeout(() => {
              RendererPokemon._renderPokedexGrid(filtersToUse.search, filtersToUse.type, region);
            }, 50);
          }
        }
      }
    }
  },

  renderPokedexRegionList: function () {
    console.log('[POKÉDEX] Renderizando: Lista de Regiões.');

    const pokedexSet = window.gameState.profile.pokedex;
    const regions = window.GameConfig.POKEDEX_REGIONS;

    const regionsHtml = regions.map(region => {
      // Progresso por região
      let caughtInRegion = 0;
      for (let i = region.startId; i <= region.endId; i++) {
        if (pokedexSet.has(i)) caughtInRegion++;
      }
      const totalInRegion = region.endId - region.startId + 1;
      const progressPercent = (caughtInRegion / totalInRegion) * 100;

      const regionColor = RendererPokemon._regionColor(region.id);
      const isLocked = caughtInRegion === 0;

      // Sprites grandes e mais próximos
      const startersHtml = (region.starters || []).map((id, idx) => {
        const isCaught = pokedexSet.has(id);
        const silhouette = isCaught ? "" : "filter: grayscale(100%) brightness(0.0); opacity:0.8;";
        const overlapStyle = idx === 0 ? "" : "margin-left:-38px;";
        // deslocamentos laterais menores para aproximar
        const xShift = idx === 0 ? "-translate-x-3" : (idx === 1 ? "translate-x-0" : "translate-x-3");
        return `
    <div class="relative inline-block w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32" style="${overlapStyle}">
      <img src="../assets/sprites/pokemon/${id}_front.png" alt="Starter"
           class="absolute left-1/2 ${xShift} -top-1
                  w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32
                  scale-[1.9] sm:scale-[2.05] md:scale-[2.2]
                  drop-shadow-[0_10px_0_rgba(0,0,0,0.2)]
                  transition-transform duration-150 group-hover:scale-[2.35] pointer-events-none"
           style="${silhouette}; z-index:${10 + idx};">
    </div>
    `;
      }).join('');

      return `
    <div onclick="event.stopPropagation(); window.openPokedexRegion('${region.id}')"
         class="group p-1.5 bg-white border-4 border-gray-800 rounded-lg shadow-lg mb-2 cursor-pointer transition-colors duration-150 relative overflow-hidden">

      <!-- Faixa diagonal mais espessa (dentro do card) -->
      <div class="absolute top-0.5 left-[-25%] rotate-[-18deg] h-16 sm:h-18 md:h-20 w-[175%] opacity-95 pointer-events-none z-0"
           style="background:${regionColor};"></div>

      <!-- Cabeçalho compacto acima da faixa -->
      <div class="relative z-20 flex justify-between items-center mb-1 border-b border-gray-300 pb-1">
        <div class="gba-font text-[14px] font-bold text-gray-800 tracking-wide">${region.name}</div>
        <div class="text-right flex flex-col items-end leading-tight">
          <div class="gba-font text-xs text-black">${caughtInRegion} / ${totalInRegion}</div>
          <div class="gba-font text-[8px] text-gray-900 ">${Math.round(progressPercent)}%</div>
        </div>
      </div>

      <!-- Sprites: mantém o MESMO tamanho atual, apenas aproximando verticalmente -->
      <div class="relative z-10 flex justify-center gap-2 sm:gap-3 md:gap-4 py-2 pt-5">
        ${startersHtml}
      </div>

      <!-- Barra de progresso compacta -->
      <div class="relative z-20 w-full bg-gray-300 h-[6px] rounded-full border border-gray-600 mt-1">
        <div class="h-[6px] rounded-full ${progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'} transition-all duration-500" style="width: ${progressPercent}%;"></div>
      </div>

      ${isLocked ? `
        <div class="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg z-30">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#fefefe" class="bi bi-lock-fill" viewBox="0 0 16 16">
            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5M4.5 9.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-6a.5.5 0 0 1-.5-.5z"/>
          </svg>
        </div>
      ` : ''}
    </div>
  `;
    }).join('');




    const totalCaught = pokedexSet.size;
    const totalAvailable = window.GameConfig.POKEDEX_LIMIT;

    const content = `
      <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">POKÉDEX NACIONAL</div>
      <div class="text-center text-sm gba-font mb-4 flex-shrink-0">
        TOTAL: ${totalCaught} / ${totalAvailable}
      </div>
      <div class="flex-grow overflow-y-auto p-2 bg-gray-100 border border-gray-400 rounded-lg">
        ${regionsHtml}
      </div>
      <button onclick="window.Renderer.showScreen('pokemonMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full mt-4 flex-shrink-0">Voltar</button>
    `;
    window.Renderer.renderGbaCard(content);
  },

  renderPokedex: function (app, extraData = {}) {
    console.log('[POKÉDEX] Chamado renderPokedex. Recebido extraData:', extraData);

    // Suporte ao payload global por bug de passagem de argumentos
    if (!extraData || Object.keys(extraData).length === 0) {
      if (window.nextScreenPayload) {
        extraData = window.nextScreenPayload;
        window.nextScreenPayload = null;
      }
    }

    const { region: regionKey } = extraData || {};
    let region = null;

    // TENTA USAR A REGIÃO ATUAL SALVA SE NENHUMA FOR PASSADA
    const finalRegionKey = regionKey || window.currentPokedexFilters.region;

    console.log('[POKÉDEX] Region Key extraída:', finalRegionKey);
    if (finalRegionKey) {
      region = window.GameConfig.POKEDEX_REGIONS.find(r => r.id === finalRegionKey);
      window.currentPokedexFilters.region = finalRegionKey; // Atualiza o filtro atual
    }

    if (!region) {
      console.log('[POKÉDEX] Região inválida ou nula. Redirecionando para lista de regiões.');
      return RendererPokemon.renderPokedexRegionList();
    }

    console.log('[POKÉDEX] Região encontrada:', region.name);

    const pokedexSet = window.gameState.profile.pokedex;
    let caughtInRegion = 0;
    for (let i = region.startId; i <= region.endId; i++) {
      if (pokedexSet.has(i)) {
        caughtInRegion++;
      }
    }

    if (caughtInRegion === 0) {
      console.warn('[POKÉDEX] Região bloqueada (0 Pokémons capturados). Redirecionando para lista.');
      return RendererPokemon.renderPokedexRegionList();
    }

    console.log(`[POKÉDEX] Iniciando renderização do Grid para ${region.name}.`);

    window.currentPokedexFilters.search = window.currentPokedexFilters.search || '';
    window.currentPokedexFilters.type = window.currentPokedexFilters.type || 'all';

    const searchQuery = window.currentPokedexFilters.search;
    const typeFilter = window.currentPokedexFilters.type;

    const allTypes = [
      "grass", "fire", "water", "bug", "normal", "poison", "electric", "ground",
      "fairy", "fighting", "psychic", "rock", "ghost", "ice", "dragon", "steel",
      "dark", "flying",
    ];

    window.filterPokedex = (newSearch, newType) => {
      const nextSearch = newSearch !== undefined ? newSearch : window.currentPokedexFilters.search;
      const nextType = newType !== undefined ? newType : window.currentPokedexFilters.type;
      console.log(`[POKÉDEX FILTER] Aplicando filtro. Busca: ${nextSearch}, Tipo: ${nextType}`);

      window.currentPokedexFilters.search = nextSearch;
      window.currentPokedexFilters.type = nextType;
      RendererPokemon._renderPokedexGrid(nextSearch, nextType, region);
    };

    RendererPokemon._ensurePokedexCacheLoaded();

    const totalInRegion = region.endId - region.startId + 1;

    const content = `
      <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">POKÉDEX ${region.name}</div>
      <div class="text-center text-sm gba-font mb-4 flex-shrink-0">REGISTRADOS: ${caughtInRegion} / ${totalInRegion}</div>
      <div class="mb-4 flex flex-col sm:flex-row gap-2 flex-shrink-0" style="z-index: 10;">
        <input id="pokedexSearch" type="text" placeholder="Buscar por Nome ou ID..."
               value="${searchQuery}"
               oninput="window.filterPokedex(this.value, undefined)"
               class="w-full sm:w-2/3 p-2 border-2 border-gray-800 rounded gba-font text-sm bg-white shadow-inner">
        <select id="pokedexFilterType" onchange="window.filterPokedex(undefined, this.value)"
                class="w-full sm:w-1/3 p-2 border-2 border-gray-800 rounded gba-font text-sm bg-white shadow-inner">
          <option value="all">TODOS OS TIPOS</option>
          ${allTypes.map((type) =>
      `<option value="${type}" ${type === typeFilter ? "selected" : ""}>${window.Utils.formatName(type)}</option>`
    ).join("")}
        </select>
      </div>
      <div class="flex-grow overflow-y-auto border border-gray-400 p-0 mb-4 bg-gray-100 pokemon-list-container" style="z-index: 5;">
        <div id="pokedexGridContainer" class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-0.5 p-0.5">
          <p class="text-center text-gray-500 gba-font p-4 col-span-full">Carregando Pokédex...</p>
        </div>
      </div>
      <button onclick="window.currentPokedexFilters.region = null; window.Renderer.showScreen('pokedex')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full mt-4 flex-shrink-0">Voltar às Regiões</button>
    `;
    window.Renderer.renderGbaCard(content);
    RendererPokemon._renderPokedexGrid(searchQuery, typeFilter, region);
  },

  _renderPokedexGrid: function (searchQuery, typeFilter, region) {
    console.log(`[POKÉDEX GRID] Renderizando grid para ${region.name}. Filtros: Busca='${searchQuery}', Tipo='${typeFilter}'`);
    const pokedexSet = window.gameState.profile.pokedex;
    const cache = window.gameState.pokedexCache || {};

    searchQuery = (searchQuery || "").toLowerCase();

    let filteredPokedex = [];
    const startId = region.startId;
    const endId = region.endId;

    for (let id = startId; id <= endId; id++) {
      const cachedData = cache[id];
      const isKnown = pokedexSet.has(id);
      const safeCachedData = cachedData || { name: null, types: [] };

      const pokemonNameRaw = safeCachedData.name ? safeCachedData.name.toLowerCase() : `poke-${id}`;
      const pokemonNameFormatted = window.Utils.formatName(pokemonNameRaw);

      let displayName;
      if (isKnown) {
        displayName = safeCachedData.name ? pokemonNameFormatted : `POKÉMON #${id.toString().padStart(3, "0")}`;
      } else {
        displayName = `???`;
      }

      // Filtro por busca
      if (searchQuery) {
        const isMatchByName = pokemonNameRaw.includes(searchQuery);
        const isMatchById = id.toString().includes(searchQuery);
        if (!isKnown && !isMatchById && !isMatchByName) {
          // passa
        } else if (!isMatchByName && !isMatchById) {
          continue;
        }
      }

      // Filtro por tipo
      if (typeFilter !== "all") {
        if (!isKnown || !safeCachedData.types || safeCachedData.types.length === 0) {
          if (searchQuery) {
            const isMatchByName = pokemonNameRaw.includes(searchQuery);
            const isMatchById = id.toString().includes(searchQuery);
            if (isMatchByName || isMatchById) {
              // mantem
            }
          }
          continue;
        }
        const hasTypeMatch = safeCachedData.types.includes(typeFilter);
        if (!hasTypeMatch) {
          continue;
        }
      }

      filteredPokedex.push({ id: id, isCaught: isKnown, name: displayName });
    }

    const pokedexHtml = filteredPokedex
      .map((p) => {
        const id = p.id;
        const isCaught = p.isCaught;
        const displayId = id.toString().padStart(3, "0");
        const displayUrl = `../assets/sprites/pokemon/${id}_front.png`;
        const displayName = p.name;
        let filterStyle = "filter: grayscale(100%) brightness(0.1);";
        const effectiveDisplayName = displayName === '???' ? '' : displayName;

        if (isCaught) {
          filterStyle = "";
        }

        return `
          <div onclick="window.Renderer.showPokedexStats(${id}, ${!isCaught})" 
               class="flex flex-col items-center p-0.5 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors duration-100 bg-white">
            <img src="${displayUrl}" alt="Pokemon #${id}" class="w-16 h-16 mb-0.5" style="${filterStyle}">
            <div class="text-center w-full truncate">
              <span class="gba-font text-[6px] font-bold ${isCaught ? "text-gray-800" : "text-gray-400"}">${effectiveDisplayName}</span>
              <div class="text-[6px] gba-font text-gray-600 mt-0.5 truncate">#${displayId}</div>
            </div>
          </div>
        `;
      }).join("");

    const gridContainer = document.getElementById('pokedexGridContainer');
    if (gridContainer) {
      gridContainer.className = "grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-0.5 p-0.5";
      gridContainer.innerHTML = pokedexHtml || '<p class="text-center text-gray-500 gba-font p-4 col-span-full">Nenhum Pokémon encontrado com o filtro atual.</p>';
    }
  },
};
