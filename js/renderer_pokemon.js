// renderer_pokemon.js
// Renderização das telas de Pokémons (Lista, Gerenciamento, Pokédex) e Mochila.

// ESTADO GLOBAL: Variável para persistir os filtros da Pokédex entre as renderizações
window.currentPokedexFilters = window.currentPokedexFilters || {
    search: '',
    type: 'all'
};
// NOVO ESTADO GLOBAL: Variável temporária para carregar o payload (extraData)
// para a próxima tela de forma robusta, contornando o bug de passagem de argumentos.
window.nextScreenPayload = null;


/**
 * NOVO: Função auxiliar global para garantir que o clique na região
 * passe os dados corretamente para a navegação.
 * @param {string} regionId - O ID da região (ex: 'kanto').
 */
window.openPokedexRegion = function(regionId) {
    console.log('[POKEDEX NAV HELPER] Chamado openPokedexRegion com ID:', regionId);
    
    if (regionId) {
        const payload = { region: regionId };
        
        // CORREÇÃO FINAL: Armazena o payload em uma variável global acessível pela função showScreen.
        window.nextScreenPayload = payload;
        
        console.log('[POKEDEX NAV HELPER] Payload ARMAZENADO no global:', window.nextScreenPayload);
        
        // Chama showScreen SEM o argumento extraData, confiando que ele será buscado globalmente.
        window.Renderer.showScreen('pokedex');
    } else {
        console.error('[POKEDEX NAV HELPER] ID da região ausente!');
    }
};

export const RendererPokemon = {
  renderPokemonList: function (app) {
    const pokemonArray = window.gameState.profile.pokemon;

    const pokemonHtml = pokemonArray
      .map((p, index) => {
        const expToNextLevel = window.Utils.calculateExpToNextLevel(p.level);
        const expPercent = Math.min(100, (p.exp / expToNextLevel) * 100);
        
        // NOVIDADE 1: Variável para identificar se é o Pokémon ativo (índice 0)
        const isCurrentActive = index === 0;

        // CORREÇÃO: O index aqui é a posição real no array, mantido para drag/drop.
        return `
        <!-- ITEM PRINCIPAL - SEM DRAG/DROP. USADO APENAS PARA ROLAGEM E RECEBER DROP -->
        <div id="pokemon-list-item-${index}" 
             data-pokemon-index="${index}"
             ondragover="window.GameLogic.allowDrop(event)"
             ondrop="window.GameLogic.drop(event)"
             ondragenter="window.GameLogic.dragEnter(event)"
             ondragleave="window.GameLogic.dragLeave(event)"
             class="flex items-center justify-between p-2 border-b border-gray-300 transition-colors duration-100 ${
               p.currentHp <= 0 ? "opacity-50" : ""
             }">
            
            <!-- ÁREA 1: DRAG HANDLE (PONTINHOS) - ÚNICO ELEMENTO ARRASTÁVEL -->
            <div data-drag-handle="true"
                 data-pokemon-index="${index}"
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
            <div class="flex items-center flex-grow min-w-0 p-1 cursor-pointer" onclick="window.Renderer.showPokemonStats('${
              p.name
            }', ${index})">
                <img src="${p.sprite}" alt="${
          p.name
        }" class="w-16 h-16 sm:w-20 sm:h-20 mr-2 flex-shrink-0">
                <!-- Ajuste de Layout: flex-col para empilhar HP e EXP, e text-xs para caber em telas pequenas -->
                <div class="flex flex-col min-w-0">
                    <div class="font-bold gba-font text-xs sm:text-sm truncate">${
                      p.name
                    } 
                    ${isCurrentActive ? '<span class="text-[8px] text-green-600">(ATUAL)</span>' : ''}
                    </div>
                    <div class="text-[8px] sm:text-xs gba-font flex flex-col sm:flex-row sm:space-x-2">
                      <span>(Nv. ${p.level})</span>
                      <span>HP: ${p.currentHp}/${p.maxHp}</span>
                      <div class="p-2 flex items-center w-full mt-1 ml-4 sm:ml-20">
                        <span class="gba-font text-[8px] mr-1 text-gray-700">EXP</span>
                        <div class="w-full bg-gray-300 h-1.5 rounded-full border border-gray-500">
                            <div class="h-1.5 rounded-full bg-blue-500 transition-all duration-500" 
                                 style="width: ${expPercent}%;"></div>
                        </div>
                        <span class="gba-font text-[8px] ml-2 text-gray-700">${Math.floor(
                          expPercent
                        )}%</span>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    `;
      })
      .join("");

    const content = `
        <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">SEUS POKÉMONS</div>
        <!-- Classe 'pokemon-list-container' com flex-grow e overflow-y-auto garante a rolagem interna -->
        <div class="pokemon-list-container flex-grow overflow-y-auto border border-gray-400 p-2 mb-4 bg-white">
            ${
              pokemonHtml ||
              '<p class="text-center text-gray-500 gba-font">Você não tem Pokémons!</p>'
            }
        </div>
        <button onclick="window.Renderer.showScreen('managePokemon')" class="gba-button bg-cyan-500 hover:bg-cyan-600 w-full mb-2 flex-shrink-0">Gerenciar Pokémons</button>
        <button onclick="window.Renderer.showScreen('pokemonMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
    `;
    window.Renderer.renderGbaCard(content);
  },

  renderManagePokemon: async function (app) {
    const pokemonArray = window.gameState.profile.pokemon;
    const evolutionCost = window.GameConfig.EVOLUTION_COST;
    const requiredExp = 1000; // Nova regra: 1000 EXP
    
    // 1. Renderiza o estado de carregamento Imediatamente
    const loadingContent = `
        <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">GERENCIAR POKÉMONS</div>
        <div id="manage-pokemon-list" class="flex-grow overflow-y-auto border border-gray-400 p-4 mb-4 bg-white flex flex-col justify-center items-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
            <p class="gba-font text-xs mt-4 text-gray-600">Verificando evoluções (PokéAPI)...</p>
        </div>
        <button onclick="window.Renderer.showScreen('pokemonList')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
    `;
    window.Renderer.renderGbaCard(loadingContent);

    // 2. Coleta os dados de evolução de forma assíncrona
    const pokemonHtmlPromises = pokemonArray.map(async (p, index) => {
        // CORREÇÃO: A checagem de "ativo" agora é sempre index === 0
        const isCurrentlyActive = index === 0;
        const canRelease = pokemonArray.length > 1;

        // USA A API: Verifica se há próxima evolução
        const nextEvolutionName = await window.PokeAPI.fetchNextEvolution(p.id);
        const isMaxEvolution = nextEvolutionName === null;

        // 2. Checagem de Custos e EXP
        const hasMoney = window.gameState.profile.money >= evolutionCost;
        const hasExp = p.exp >= requiredExp;

        // 3. Pode evoluir se: NÃO é estágio final E tem dinheiro E tem EXP
        const canEvolve = !isMaxEvolution && hasMoney && hasExp;

        // Define a classe e o texto do botão de Evoluir
        let evolveButtonText = "Evoluir";
        let evolveButtonClass = "bg-blue-500 hover:bg-blue-600";

        if (isMaxEvolution) {
          evolveButtonText = "Evolução Máxima";
          evolveButtonClass = "bg-gray-400 cursor-not-allowed";
        } else if (!hasMoney) {
          evolveButtonText = `Falta P$ (${evolutionCost}P$)`;
          evolveButtonClass = "bg-gray-400 cursor-not-allowed";
        } else if (!hasExp) {
          evolveButtonText = `Falta EXP (${requiredExp}xp)`;
          evolveButtonClass = "bg-gray-400 cursor-not-allowed";
        }

        const isDisabledEvolve = !canEvolve && !isMaxEvolution;
        
        // NOVIDADE 2: Lógica do botão USAR/ATIVO (conforme pedido pelo usuário)
        const useButtonText = isCurrentlyActive ? "ATIVO (ATUAL)" : "USAR";
        const isDisabledUse = isCurrentlyActive;
        const useButtonClass = isCurrentlyActive 
            ? "bg-green-600 cursor-not-allowed opacity-70" 
            : "bg-green-500 hover:bg-green-600";


        // Gera o HTML do item:
        return `
                <!-- flex-col no mobile, sm:flex-row no desktop/tablet -->
                <div class="flex flex-col sm:flex-row items-center justify-between p-2 border-b border-gray-300 flex-shrink-0 space-y-2 sm:space-y-0">
                    <!-- Informações do Pokémon (Ocupa a maior parte do espaço) -->
                    <div class="flex items-center w-full sm:w-1/2">
                        <img src="${p.sprite}" alt="${
          p.name
        }" class="w-10 h-10 mr-2 flex-shrink-0">
                        <!-- Ajuste de texto para garantir que o nome seja exibido e não cortado -->
                        <div class="flex-grow min-w-0">
                            <div class="font-bold gba-font break-words text-xs">${
                              p.name
                            } (Nv. ${p.level}) ${
          isCurrentlyActive
            ? '<span class="text-[8px] text-green-600">(ATUAL)</span>'
            : ""
        }</div>
                            <div class="text-[8px] gba-font">HP: ${
                              p.currentHp
                            }/${p.maxHp} | EXP: ${p.exp}/${requiredExp}</div>
                        </div>
                    </div>
                    
                    <!-- Contêiner dos Botões (Empilha verticalmente em mobile, fica lado a lado em desktop) -->
                    <div class="flex space-x-2 w-full sm:w-1/2 justify-end">
                        <!-- NOVO BOTÃO 'USAR' / 'ATIVO' -->
                        <button onclick="${
                          isDisabledUse
                            ? ""
                            : `window.GameLogic.setPokemonAsActive(${index})`
                        }"
                            class="gba-button text-xs w-1/4 h-12 ${useButtonClass}"
                            ${isDisabledUse ? "disabled" : ""}>
                            ${useButtonText}
                        </button>
                        
                        <button onclick="${
                          canEvolve
                            ? `window.GameLogic.evolvePokemon(${index})`
                            : ""
                        }"
                            class="gba-button text-xs h-12 ${evolveButtonClass}"
                            ${isDisabledEvolve ? "disabled" : ""}>
                            ${evolveButtonText}
                        </button>
                        
                        <button onclick="${
                          canRelease
                            ? `window.GameLogic.releasePokemon(${index})`
                            : ""
                        }"
                            class="gba-button text-xs w-1/4 h-12 ${
                              canRelease
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-gray-400 cursor-not-allowed"
                            }"
                            ${!canRelease ? "disabled" : ""}>
                            Soltar
                        </button>
                    </div>
                </div>
            `;
      });

    // 3. Espera que todas as verificações assíncronas sejam concluídas
    const pokemonHtmlArray = await Promise.all(pokemonHtmlPromises);
    const pokemonHtml = pokemonHtmlArray.join("");

    // 4. Renderiza o conteúdo final no lugar do loading
    const finalContent = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">GERENCIAR POKÉMONS</div>
            <!-- flex-grow e overflow-y-auto para a lista de gerenciamento -->
            <div class="flex-grow overflow-y-auto border border-gray-400 p-2 mb-4 bg-white">${pokemonHtml}</div>
            <button onclick="window.Renderer.showScreen('pokemonList')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
        
    window.Renderer.renderGbaCard(finalContent);
  },

  showPokemonStats: async function (pokemonName, index) {
    const pokemon = window.gameState.profile.pokemon[index];
    if (!pokemon) {
      window.Utils.showModal("errorModal", "Pokémon não encontrado!");
      return;
    }

    const healItem = window.gameState.profile.items.find((i) => i.healAmount);
    const isHealItemAvailable = healItem && healItem.quantity > 0;
    const expToNextLevel = window.Utils.calculateExpToNextLevel(pokemon.level);
    const expPercent = Math.min(100, (pokemon.exp / expToNextLevel) * 100);
    const movesHtml = pokemon.moves
      .map(
        (move) => `<li class="text-sm">${window.Utils.formatName(move)}</li>`
      )
      .join("");
    const typesHtml = pokemon.types
      .map(
        (type) =>
          `<span class="bg-blue-300 text-blue-800 text-xs font-bold mr-1 px-2.5 py-0.5 rounded-full gba-font">${type.toUpperCase()}</span>`
      )
      .join("");

    const statsHtml = Object.entries(pokemon.stats)
      .map(
        ([stat, value]) => `
            <div class="flex justify-between items-center mb-1">
                <span class="text-xs gba-font">${window.Utils.formatName(
                  stat
                )}:</span>
                <span class="text-xs gba-font">${value}</span>
            </div>
        `
      )
      .join("");
      
    // NOVO: Lógica da Cadeia de Evolução
    const evolutionChain = await window.PokeAPI.fetchEvolutionChainData(pokemon.id);
    const pokedexSet = window.gameState.profile.pokedex;

    const evolutionItemsHtml = evolutionChain.map((evo, evoIndex) => {
        const isKnown = pokedexSet.has(evo.id);
        const spriteId = evo.id;
        const isLast = evoIndex === evolutionChain.length - 1;
        
        // CORREÇÃO: Usar spriteId (que é o ID numérico da evolução)
        let spriteUrl = `../assets/sprites/pokemon/${spriteId}_front.png`;
        // Silhueta para Pokémon não descoberto: apenas filtro de cor, sem o 'brightness(0.1)' para manter a transparência da imagem original
        const silhouetteFilter = "filter: grayscale(100%) brightness(0);";
        let filterStyle = isKnown ? "" : silhouetteFilter;
        let displayName = isKnown ? window.Utils.formatName(evo.name) : "???";

        // Se for o Pokémon atual, destaque.
        const isActive = evo.id === pokemon.id;
        const currentMarker = isActive ? '' : '';

        // Renderiza o Pokémon. O fundo branco é aplicado ao DIV, não ao IMG.
        let evoItem = `
            <div class="flex flex-col items-center flex-shrink-0 w-20 p-1 bg-white shadow-md rounded-lg">
                <img src="${spriteUrl}" alt="${displayName}" class="w-12 h-12 mb-1  ${isActive ? 'border border-4 border-yellow-500 rounded-full' : ''}" style="${filterStyle}">
                <span class="text-[8px] gba-font text-center">${displayName} ${currentMarker}</span>
            </div>
        `;
        
        // Adiciona a seta se não for o último item da cadeia
        if (!isLast) {
            evoItem += `
                <div class="flex-shrink-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#3b82f6" class="bi bi-arrow-right-short" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8"/>
                    </svg>
                </div>
            `;
        }

        return evoItem;
    }).join('');
    
    // NOVO: Renderiza a área de evolução com layout flexível para os itens e setas
    const evolutionSection = `
        <div class="mt-4 p-2 border-t border-gray-400 flex-shrink-0">
            <h3 class="font-bold gba-font text-sm mb-2 text-center text-blue-700">CADEIA EVOLUTIVA</h3>
            <div class="flex justify-center items-center p-2 bg-gray-100 rounded-lg space-x-2">
                ${evolutionItemsHtml}
            </div>
        </div>
    `;


    const modalContent = `
            <div class="text-xl font-bold text-gray-800 gba-font mb-4 text-center flex-shrink-0">
                #${pokemon.id.toString().padStart(3, "0")} - ${
      pokemon.name
    }
            </div>
            <img src="${pokemon.sprite}" alt="${
      pokemon.name
    }" class="w-32 h-32 mx-auto mb-4 flex-shrink-0">
            
            <div class="text-center mb-2 flex-shrink-0">${typesHtml}</div>
            
            <div class="text-left gba-font text-xs flex-shrink-0">
                <p><strong>Nível:</strong> ${pokemon.level}</p>
                <p><strong>HP:</strong> ${pokemon.currentHp}/${
      pokemon.maxHp
    }</p>
                <div class="mt-2 flex items-center">
                    <span class="gba-font text-[10px] mr-2">EXP</span>
                    <div class="w-full bg-gray-300 h-2 rounded-full border border-gray-500">
                        <div class="h-2 rounded-full bg-blue-500 transition-all duration-500" 
                             style="width: ${expPercent}%;"></div>
                    </div>
                </div>
                 <p class="text-[8px] text-gray-700 mt-1">Progresso: ${
                   pokemon.exp
                 } / ${expToNextLevel}</p>
            </div>
            
            ${evolutionSection}
            
            <div class="mt-4 p-2 border-t border-gray-400 flex-grow overflow-y-auto">
                <h3 class="font-bold gba-font text-sm mb-2">Estatísticas Base:</h3>
                ${statsHtml}
                <h3 class="font-bold gba-font text-sm mb-2 mt-4">Ataques:</h3>
                <ul class="list-disc list-inside gba-font text-xs">
                    ${movesHtml}
                </ul>
            </div>
            
            ${
              isHealItemAvailable && healItem
                ? `
                <button onclick="window.Utils.hideModal('pokemonStatsModal'); window.GameLogic.useItem('${healItem.name}', ${index})" class="gba-button bg-green-500 hover:bg-green-600 mt-4 w-full mb-2 flex-shrink-0">
                    Usar ${healItem.name} (x${healItem.quantity})
                </button>
                `
                : ""
            }
            
            <button onclick="window.Utils.hideModal('pokemonStatsModal')" class="gba-button bg-gray-500 hover:bg-gray-600 mt-4 w-full flex-shrink-0">Fechar</button>
        `;

    const modal = document.getElementById("pokemonStatsModal");
    if (modal) {
      const modalBody = modal.querySelector(".modal-body");
      if (modalBody) {
        // Para que o modal interno também use flexbox e se ajuste
        modalBody.classList.add("flex", "flex-col", "h-full");
        modalBody.innerHTML = modalContent;
        modal.classList.remove("hidden");
      }
    }
  },

  showPokedexStats: async function (pokemonId, isSilhouette = false) {
    if (isSilhouette) {
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
            </div>
            <button onclick="window.Utils.hideModal('pokemonStatsModal')" class="gba-button bg-gray-500 hover:bg-gray-600 mt-4 w-full flex-shrink-0">Fechar</button>
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

    // Busca os dados do Pokémon APENAS para visualização (isPokedexView=true)
    const [pokemonData, speciesData, evolutionChain] = await Promise.all([
      window.PokeAPI.fetchPokemonData(pokemonId, true),
      window.PokeAPI.fetchSpeciesData(pokemonId), // NOVO: Busca dados de espécie
      window.PokeAPI.fetchEvolutionChainData(pokemonId), // NOVO: Busca dados de evolução
    ]);

    if (!pokemonData || !speciesData) {
      window.Utils.showModal("errorModal", "Dados do Pokémon não encontrados!");
      return;
    }

    const movesHtml = pokemonData.moves
      .map(
        (move) => `<li class="text-sm">${window.Utils.formatName(move)}</li>`
      )
      .join("");
    const typesHtml = pokemonData.types
      .map(
        (type) =>
          `<span class="bg-blue-300 text-blue-800 text-xs font-bold mr-1 px-2.5 py-0.5 rounded-full gba-font">${type.toUpperCase()}</span>`
      )
      .join("");

    const statsHtml = Object.entries(pokemonData.stats)
      .map(
        ([stat, value]) => `
            <div class="flex justify-between items-center mb-1">
                <span class="text-xs gba-font">${window.Utils.formatName(
                  stat
                )}:</span>
                <span class="text-xs gba-font">${value}</span>
            </div>
        `
      )
      .join("");

    // Conversão de unidades:
    // Altura: dm para m (divide por 10)
    const heightMeters = (speciesData.height / 10).toFixed(1);
    // Peso: hg para kg (divide por 10)
    const weightKg = (speciesData.weight / 10).toFixed(1);
    
    // NOVO: Lógica da Cadeia de Evolução na Pokédex (com silhueta para não capturados)
    const pokedexSet = window.gameState.profile.pokedex;

    const evolutionItemsHtml = evolutionChain.map((evo, evoIndex) => {
        const isKnown = pokedexSet.has(evo.id);
        const spriteId = evo.id;
        const isLast = evoIndex === evolutionChain.length - 1;
        
        let spriteUrl = `../assets/sprites/pokemon/${spriteId}_front.png`;
        const silhouetteFilter = "filter: grayscale(100%) brightness(0);";
        let filterStyle = isKnown ? "" : silhouetteFilter;
        let displayName = isKnown ? window.Utils.formatName(evo.name) : "???";

        // Se for o Pokémon atual, destaque.
        const isActive = evo.id === pokemonData.id;
        const currentMarker = isActive ? '' : '';

        // Renderiza o Pokémon. O fundo branco é aplicado ao DIV, não ao IMG.
        let evoItem = `
            <div class="flex flex-col items-center flex-shrink-0 w-20 p-1 bg-white shadow-md rounded-lg">
                <img src="${spriteUrl}" alt="${displayName}" class="w-12 h-12 mb-1" style="${filterStyle}">
                <span class="text-[8px] gba-font text-center">${displayName} ${currentMarker}</span>
            </div>
        `;
        
        // Adiciona a seta se não for o último item da cadeia
        if (!isLast) {
            evoItem += `
                <div class="flex-shrink-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#3b82f6" class="bi bi-arrow-right-short" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8"/>
                    </svg>
                </div>
            `;
        }
        
        return evoItem;
    }).join('');
    
    const evolutionSection = `
        <div class="mt-4 p-2 border-t border-gray-400 flex-shrink-0">
            <h3 class="font-bold gba-font text-sm mb-2 text-center text-blue-700">CADEIA EVOLUTIVA</h3>
            <div class="flex justify-center items-center p-2 bg-gray-100 rounded-lg space-x-2">
                ${evolutionItemsHtml}
            </div>
        </div>
    `;


    const modalContent = `
            <div class="text-xl font-bold text-gray-800 gba-font mb-4 text-center flex-shrink-0">
                #${pokemonData.id.toString().padStart(3, "0")} - ${
      pokemonData.name
    }
            </div>
            <img src="${pokemonData.sprite}" alt="${
      pokemonData.name
    }" class="w-32 h-32 mx-auto mb-4 flex-shrink-0">
            
            <div class="text-center mb-2 flex-shrink-0">${typesHtml}</div>
            
            <div class="text-left gba-font text-xs flex-shrink-0 border-b border-gray-400 pb-2 mb-2">
                <p class="text-[8px] sm:text-xs"><strong>Altura:</strong> ${heightMeters} m | <strong>Peso:</strong> ${weightKg} kg</p>
                <p class="mt-2 text-[8px] sm:text-xs text-justify"><strong>DESCRIÇÃO:</strong> ${
                  speciesData.description
                }</p>
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
            <button onclick="window.Utils.hideModal('pokemonStatsModal')" class="gba-button bg-gray-500 hover:bg-gray-600 mt-4 w-full flex-shrink-0">Fechar</button>
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

  // NOVO: Função que lista os cards de Região
  renderPokedexRegionList: function (app) {
    // [LOG B] Adicionado log para rastrear a renderização
    console.log('[POKEDEX] Renderizando: Lista de Regiões.');
    
    const pokedexSet = window.gameState.profile.pokedex;
    const regions = window.GameConfig.POKEDEX_REGIONS;

    const regionsHtml = regions.map(region => {
        // 1. Calcula o progresso da região
        let caughtInRegion = 0;
        for (let i = region.startId; i <= region.endId; i++) {
            if (pokedexSet.has(i)) {
                caughtInRegion++;
            }
        }
        const totalInRegion = region.endId - region.startId + 1;
        const progressPercent = (caughtInRegion / totalInRegion) * 100;
        
        // NOVO: Lógica do Cadeado
        const isLocked = caughtInRegion === 0;
        const cardClass = isLocked 
            ? "opacity-50 cursor-not-allowed bg-gray-200" 
            : "hover:bg-gray-100";

        // 2. Cria os sprites dos starters
        // MUDANÇA: Aumenta o tamanho dos sprites e usa justify-center para centralizar no card.
        const startersHtml = region.starters.map(id => {
            const isCaught = pokedexSet.has(id);
            // Se a região estiver bloqueada, silhueta todos
            const silhouetteFilter = isCaught && !isLocked ? "" : "filter: grayscale(100%) brightness(0.1);";
            // Aumentando as classes de tamanho para w-16 h-16
            return `<img src="../assets/sprites/pokemon/${id}_front.png" 
                          alt="Starter" 
                          class="w-16 h-16 transition-transform duration-100" 
                          style="${silhouetteFilter}">`;
        }).join('');

        // 3. Cria a barra de progresso
        const progressBarHtml = `
            <div class="w-full bg-gray-400 h-2 rounded-full border border-gray-600 mt-2">
                <div class="h-2 rounded-full ${progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'} transition-all duration-500" 
                     style="width: ${progressPercent}%;"></div>
            </div>
        `;

        // 4. Renderiza o card da região
        // MUDANÇA: Ajusta o layout interno para empilhar o nome/progresso e os sprites.
        return `
            <div onclick="event.stopPropagation(); window.openPokedexRegion('${region.id}')" 
                 class="p-3 bg-white border-4 border-gray-800 rounded-lg shadow-lg mb-3 cursor-pointer transition-colors duration-150 relative ${cardClass}">
                
                <!-- Nome e Progresso (Parte Superior) -->
                <div class="flex justify-between items-center mb-2 border-b border-gray-300 pb-1">
                    <div class="gba-font text-base font-bold text-gray-800">${region.name}</div>
                    <div class="text-right flex flex-col items-end">
                        <div class="gba-font text-xs text-blue-700">${caughtInRegion} / ${totalInRegion}</div>
                        <div class="gba-font text-[8px] text-gray-500">${Math.round(progressPercent)}%</div>
                    </div>
                </div>
                
                <!-- Sprites de Capa (Parte Principal) -->
                <div class="flex space-x-2 justify-center py-2">
                    ${startersHtml}
                </div>

                ${progressBarHtml}
                
                <!-- Ícone de Cadeado se estiver bloqueado -->
                ${isLocked ? `
                    <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="#fefefe" class="bi bi-lock-fill" viewBox="0 0 16 16">
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
        
        <!-- Lista de Regiões -->
        <div class="flex-grow overflow-y-auto p-2 bg-gray-100 border border-gray-400 rounded-lg">
            ${regionsHtml}
        </div>
        
        <button onclick="window.Renderer.showScreen('pokemonMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full mt-4 flex-shrink-0">Voltar</button>
    `;
    
    window.Renderer.renderGbaCard(content);
  },

  // CORREÇÃO APLICADA: Usa valor padrão para `extraData` e desestrutura com fallback.
  // Esta função agora atua como um roteador.
  renderPokedex: function (app, extraData = {}) {
    // [LOG C] Adicionado log para rastrear a entrada
    console.log('[POKÉDEX] Chamado renderPokedex. Recebido extraData:', extraData);
    
    // 1. Tenta obter a chave da região do extraData, garantindo que não seja nula.
    const { region: regionKey } = extraData || {};
    let region = null;
    
    // [LOG D] Adicionado log para rastrear a chave da região
    console.log('[POKÉDEX] Region Key extraída:', regionKey);


    if (regionKey) {
      // Busca a região pelo ID
      region = window.GameConfig.POKEDEX_REGIONS.find(r => r.id === regionKey);
    } 

    if (!region) {
        // [LOG E] Adicionado log para rastrear o redirecionamento
        console.log('[POKÉDEX] Região inválida ou nula. Redirecionando para lista de regiões.');
        // Se a região não for passada (chamada inicial do menu) ou for inválida, 
        // mostra a lista de regiões.
        return RendererPokemon.renderPokedexRegionList(app);
    }
    
    // [LOG F] Adicionado log para rastrear a região encontrada
    console.log('[POKÉDEX] Região encontrada:', region.name);

    // --- Lógica para renderizar o GRID da região específica ---
    
    // Verifica se a região está bloqueada antes de renderizar o grid
    const pokedexSet = window.gameState.profile.pokedex;
    let caughtInRegion = 0;
    for (let i = region.startId; i <= region.endId; i++) {
        if (pokedexSet.has(i)) {
            caughtInRegion++;
        }
    }
    
    if (caughtInRegion === 0) {
        // [LOG G] Adicionado log para rastrear bloqueio
        console.warn('[POKÉDEX] Região bloqueada (0 Pokémons capturados). Redirecionando para lista.');
        // Se a região não tem nenhum Pokémon capturado, volta para a lista e mostra o cadeado
        return RendererPokemon.renderPokedexRegionList(app);
    }
    
    // [LOG H] Adicionado log para rastrear o início da renderização do Grid
    console.log(`[POKÉDEX] Iniciando renderização do Grid para ${region.name}.`);


    // 1. Configura o filtro de estado global
    window.currentPokedexFilters.region = regionKey;
    window.currentPokedexFilters.search = window.currentPokedexFilters.search || '';
    window.currentPokedexFilters.type = window.currentPokedexFilters.type || 'all';
    
    const searchQuery = window.currentPokedexFilters.search;
    const typeFilter = window.currentPokedexFilters.type;


    const allTypes = [
      "grass", "fire", "water", "bug", "normal", "poison", "electric", "ground", 
      "fairy", "fighting", "psychic", "rock", "ghost", "ice", "dragon", "steel", 
      "dark", "flying",
    ];

    // 2. Definição da função de filtro global (para ser usada pelo oninput/onchange)
    window.filterPokedex = (newSearch, newType) => {
      
      const nextSearch = newSearch !== undefined ? newSearch : window.currentPokedexFilters.search;
      const nextType = newType !== undefined ? newType : window.currentPokedexFilters.type;
      
      console.log(`[POKÉDEX FILTER] Aplicando filtro. Busca: ${nextSearch}, Tipo: ${nextType}`);

      window.currentPokedexFilters.search = nextSearch;
      window.currentPokedexFilters.type = nextType;

      // Chama APENAS a renderização do grid, passando o OBJETO region
      RendererPokemon._renderPokedexGrid(nextSearch, nextType, region);
    };

    // 3. Chamada da função de cache com os filtros atuais
    RendererPokemon._ensurePokedexCacheLoaded(window.currentPokedexFilters);

    const totalInRegion = region.endId - region.startId + 1;


    // Estrutura de Conteúdo: Apenas a estrutura (filtros, cabeçalho e container do grid)
    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">POKÉDEX ${region.name}</div>
            
            <!-- Contador de Registros -->
            <div class="text-center text-sm gba-font mb-4 flex-shrink-0">
                REGISTRADOS: ${caughtInRegion} / ${totalInRegion}
            </div>
            
            <!-- Área de Busca e Filtro -->
            <div class="mb-4 flex flex-col sm:flex-row gap-2 flex-shrink-0" style="z-index: 10;">
                <!-- Busca por Nome/ID -->
                <input id="pokedexSearch" type="text" placeholder="Buscar por Nome ou ID..."
                       value="${searchQuery}"
                       oninput="window.filterPokedex(this.value, undefined)"
                       class="w-full sm:w-2/3 p-2 border-2 border-gray-800 rounded gba-font text-sm bg-white shadow-inner">
                       
                <!-- Filtro por Tipo -->
                <select id="pokedexFilterType" onchange="window.filterPokedex(undefined, this.value)"
                        class="w-full sm:w-1/3 p-2 border-2 border-gray-800 rounded gba-font text-sm bg-white shadow-inner">
                    <option value="all">TODOS OS TIPOS</option>
                    ${allTypes
                      .map(
                        (type) =>
                          `<option value="${type}" ${
                            type === typeFilter ? "selected" : ""
                          }>${window.Utils.formatName(type)}</option>`
                      )
                      .join("")}
                </select>
            </div>
            
            <!-- Container Onde APENAS o GRID de Pokémons será Atualizado -->
            <div class="flex-grow overflow-y-auto border border-gray-400 p-0 mb-4 bg-gray-100 pokemon-list-container" style="z-index: 5;">
                <div id="pokedexGridContainer" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1 p-1">
                    <!-- O grid de Pokémons será injetado aqui pela função _renderPokedexGrid -->
                    <p class="text-center text-gray-500 gba-font p-4 col-span-full">Carregando Pokédex...</p>
                </div>
            </div>
            
            <button onclick="window.Renderer.showScreen('pokedex')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar às Regiões</button>
        `;
    window.Renderer.renderGbaCard(content);
    
    // Inicia a renderização do grid após a estrutura ser desenhada
    RendererPokemon._renderPokedexGrid(searchQuery, typeFilter, region);
  },

  // NOVO: Aceita o objeto region para filtrar o grid
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

      const pokemonNameRaw = safeCachedData.name
        ? safeCachedData.name.toLowerCase()
        : `poke-${id}`; 
      const pokemonNameFormatted = window.Utils.formatName(pokemonNameRaw);

      let displayName;
      if (isKnown) {
        displayName = safeCachedData.name
          ? pokemonNameFormatted
          : `POKÉMON #${id.toString().padStart(3, "0")}`;
      } else {
        displayName = `???`;
      }

      // --- Lógica de Filtragem ---
      // 1. Filtro por Busca (Nome ou ID)
      if (searchQuery) {
        const isMatchByName = pokemonNameRaw.includes(searchQuery);
        const isMatchById = id.toString().includes(searchQuery);

        if (!isMatchByName && !isMatchById) {
          continue;
        }
      }

      // 2. Filtro por Tipo
      if (typeFilter !== "all") {
        if (!isKnown || !safeCachedData.types || safeCachedData.types.length === 0) {
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
        let displayName = p.name;
        let filterStyle = "filter: grayscale(100%) brightness(0.1);";

        const effectiveDisplayName = displayName === '???' ? '' : displayName; // Removido o ID daqui

        if (isCaught) {
          filterStyle = "";
        }
        
        // CORREÇÃO AQUI: Aumentar o w-16 h-16 e usar p-0.5 para compactar
        // Mudar o grid-cols-3 para grid-cols-4 no mobile para permitir mais espaço horizontal
        return `
            <div onclick="window.Renderer.showPokedexStats(${id}, ${!isCaught})" 
                 class="flex flex-col items-center p-0.5 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors duration-100 bg-white">
                <img src="${displayUrl}" alt="Pokemon #${id}" class="w-16 h-16 mb-0.5" style="${filterStyle}">
                
                <!-- Nome/ID (Placeholder para escala de grade) -->
                <div class="text-center w-full truncate">
                    <span class="gba-font text-[6px] font-bold ${
                      isCaught ? "text-gray-800" : "text-gray-400"
                    }">${effectiveDisplayName}</span>
                    <div class="text-[6px] gba-font text-gray-600 mt-0.5 truncate">
                       #${displayId}
                    </div>
                </div>
            </div>
        `;
      })
      .join("");
    
    // CORREÇÃO AQUI: Ajustar o layout do grid para acomodar os sprites maiores e apertados
    const gridContainer = document.getElementById('pokedexGridContainer');
    if (gridContainer) {
        // Altera o layout do grid para mais colunas e menos espaçamento
        // O container principal ainda tem `grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1 p-1`
        // Vamos aumentar o grid-cols-3 para 4 e manter o resto para um visual "amontoado"
        gridContainer.className = "grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-0.5 p-0.5";
        
        gridContainer.innerHTML = pokedexHtml ||
                  '<p class="text-center text-gray-500 gba-font p-4 col-span-full">Nenhum Pokémon encontrado com o filtro atual.</p>';
    }
  },

  _ensurePokedexCacheLoaded: async function (currentFilters = {}) {
    // Isso deve carregar todos os Pokémons até o limite geral (POKEDEX_LIMIT)
    const totalAvailable = window.GameConfig.POKEDEX_LIMIT;
    window.gameState.pokedexCache = window.gameState.pokedexCache || {}; 
    const cache = window.gameState.pokedexCache; 
    
    let cacheUpdated = false;

    if (Object.keys(cache).length >= totalAvailable) {
      return;
    }

    const fetchPromises = [];
    for (let id = 1; id <= totalAvailable; id++) {
      if (!cache[id] && window.gameState.profile.pokedex.has(id)) {
        fetchPromises.push(
          window.PokeAPI.fetchPokemonData(id, true)
            .then((data) => {
              if (data && data.id) {
                if (!cache[data.id]) {
                  cache[data.id] = { name: data.name, types: data.types };
                }
                cacheUpdated = true;
              }
            })
            .catch((e) =>
              console.error(`Falha ao buscar ID ${id} para cache:`, e)
            )
        );
      }
    }

    if (Object.keys(cache).length < totalAvailable) {
      for (let id = 1; id <= totalAvailable; id++) {
        if (!cache[id]) {
          cache[id] = { name: null, types: [] }; 
          cacheUpdated = true;
        }
      }
    }

    if (fetchPromises.length > 0) {
      await Promise.allSettled(fetchPromises);

      if (cacheUpdated) {
        window.Utils.saveGame();
        
        const currentScreen = window.gameState.currentScreen;
        const regionKey = window.currentPokedexFilters.region;

        if (currentScreen === 'pokedex' && regionKey) {
            // Se estiver na tela de uma região específica, renderiza o grid novamente
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

  // NOVO: Adicionei lógica de visualização e uso de itens à mochila
  renderBag: function (app, extraData = {}) {
    const healItem = window.gameState.profile.items.find((i) => i.healAmount);
    const hasHealItem = healItem && healItem.quantity > 0;

    let itemsHtml = window.gameState.profile.items
      .filter((item) => item.quantity > 0)
      .map((item) => {
        let actionText = "";
        let useButton = "";
        
        // NOVO: Obtém o spriteUrl do GameConfig
        const itemConfig = window.GameConfig.SHOP_ITEMS.find(i => i.name === item.name);
        const spriteUrl = itemConfig ? itemConfig.spriteUrl : "";


        if (item.healAmount) {
          actionText = `<span class="text-xs text-green-600 gba-font ml-2">(Cura)</span>`;
          // Linka para a tela de lista de Pokémons, mas agora com um item ativo selecionado
          useButton = `<button onclick="window.Renderer.showScreen('pokemonList', { itemToUse: '${item.name}' })" class="gba-button bg-green-500 hover:bg-green-600 w-full sm:w-auto h-8 text-xs">USAR</button>`;
        } else if (item.catchRate) {
          actionText = `<span class="text-xs text-blue-600 gba-font ml-2">(Captura)</span>`;
          // Pokébolas não podem ser usadas fora de batalha, então não mostramos o botão.
        }

        return `
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 border-b border-gray-300 flex-shrink-0 bg-white rounded-md shadow-sm">
                    
                    <!-- Item Info (Icon, Name, Quantity) -->
                    <div class="flex items-center flex-grow min-w-0">
                         ${
                           spriteUrl
                             ? `<img src="${spriteUrl}" alt="${item.name}" class="w-8 h-8 mr-2 flex-shrink-0">`
                             : ""
                         }
                        <div class="flex-grow min-w-0">
                            <span class="gba-font text-xs sm:text-sm truncate">${
                              item.name
                            }</span>
                            <span class="gba-font text-[10px] sm:text-xs block">x${
                              item.quantity
                            } ${actionText}</span>
                        </div>
                    </div>
                    
                    <!-- Action Button (Use) -->
                    <div class="flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                        ${useButton}
                    </div>
                </div>
            `;
      })
      .join("");

    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">MOCHILA</div>
            <p class="text-center text-sm gba-font mb-4 flex-shrink-0 text-gray-600">
                ${
                  hasHealItem
                    ? "Poções podem ser usadas aqui. Pokébolas apenas em batalha."
                    : "Sua mochila contém seus tesouros."
                }
            </p>
            <!-- flex-grow e overflow-y-auto para a lista de itens -->
            <div class="flex-grow overflow-y-auto border border-gray-400 p-2 mb-4 bg-gray-100 space-y-2">
            ${
              itemsHtml ||
              '<p class="text-center text-gray-500 gba-font p-4">Mochila vazia!</p>'
            }
            </div>
            <button onclick="window.Renderer.showScreen('pokemonMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    window.Renderer.renderGbaCard(content);
  },
};
