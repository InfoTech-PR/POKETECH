/**
 * js/renderer.js
 * MÓDULO 5: RENDERER
 * Gerencia toda a Geração de UI e Navegação de Tela.
 */

// REMOVIDO: importação estática para evitar problemas de cache. 
// A dependência 'Utils' agora é acessada através do objeto 'window' (exposto pelo app.js).

/**
 * Módulo para gerenciar toda a Geração de UI e Navegação de Tela.
 */
export const Renderer = {
  /** Função de navegação principal. */
  showScreen: function (screenId, extraData = null) {
    window.gameState.currentScreen = screenId;
    const app = document.getElementById("app-container");
    
    // O wrapper do card GBA que existe no index.html (class="gba-screen")
    const gbaScreen = document.querySelector(".gba-screen");
    if (gbaScreen) {
        // Limpa o conteúdo antes de renderizar a nova tela
        gbaScreen.innerHTML = "";
    } else {
        // Fallback (nunca deve acontecer se o index.html estiver correto)
        console.error("Elemento .gba-screen não encontrado.");
        return;
    }


    switch (screenId) {
      case "initialMenu":
        Renderer.renderInitialMenu(app);
        break;
      case "mainMenu":
        Renderer.renderMainMenu(app);
        break;
      case "profile":
        Renderer.renderProfile(app);
        break;
      case "pokemonList":
        Renderer.renderPokemonList(app);
        break;
      case "bag":
        Renderer.renderBag(app, extraData);
        break;
      case "pokedex":
        Renderer.renderPokedex(app);
        break;
      case "managePokemon":
        Renderer.renderManagePokemon(app);
        break;
      case "battle":
        Renderer.renderBattleScreen(app);
        break;
      case "switchPokemon":
        Renderer.renderSwitchPokemon(app);
        break;
      case "pvpSetup":
        Renderer.renderPvpSetup(app);
        break;
      case "pvpWaiting":
        Renderer.renderPvpWaiting(window.gameState.pvpRoomId);
        break;
      case "healCenter":
        Renderer.renderHealCenter(app);
        break;
      case "shop":
        Renderer.renderShop(app);
        break;
      case "preferences":
        Renderer.renderPreferences(app); // NOVO CASE
        break;
      // NOVOS SUBMENUS
      case "pokemonMenu":
        Renderer.renderPokemonMenu(app);
        break;
      case "serviceMenu":
        Renderer.renderServiceMenu(app);
        break;
      case "profileMenu":
        Renderer.renderProfileMenu(app);
        break;
      default:
        Renderer.renderMainMenu(app);
    }
  },

  /** Template HTML para o card estilo GBA. (Agora apenas injeta o conteúdo no gba-screen existente) */
  renderGbaCard: function (contentHtml) {
    // Encontra o elemento gba-screen que já existe no DOM (graças ao index.html)
    const gbaScreen = document.querySelector(".gba-screen");
    if (gbaScreen) {
        gbaScreen.innerHTML = contentHtml;
    } else {
        console.error("Elemento .gba-screen não encontrado para renderizar card.");
    }
  },

  renderInitialMenu: function (app) {
    const trainerName =
      window.gameState.profile.trainerName === "NOVO TREINADOR"
        ? ""
        : window.gameState.profile.trainerName;

    const currentGender = window.gameState.profile.trainerGender;

    const getStarterSpriteKey = (name) => {
      switch (name) {
        case "bulbasaur":
          return "1";
        case "charmander":
        case "charizard": // Adicionado para carregar imagens corretas
          return "4";
        case "squirtle":
          return "7";
        default:
          return name;
      }
    };

    const content = `
            <!-- Adiciona a classe 'relative' ao container principal para que o botão 'reset' posicione-se corretamente -->
            <div class="h-full w-full flex flex-col justify-between relative">
            
                <!-- Conteúdo Principal do Menu -->
                <div class="flex-grow flex flex-col items-center p-4 overflow-y-auto">
                    <!-- Título como Imagem -->
                    <div class="flex justify-center mb-4 flex-shrink-0">
                        <img id="titleImage" src="https://64.media.tumblr.com/a1e87d2030a73aee16661e8807da6c1d/tumblr_mkhnmmFwaA1rxvkeso1_500.gif" alt="Título do Jogo" class="w-full max-w-sm" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <h1 class="text-3xl font-bold text-gray-800 gba-font" style="display:none;">POKÉMON RPG</h1>
                    </div>
                    
                    <div class="mb-4 flex-shrink-0 w-full max-w-xs">
                        <label for="trainerNameInput" class="text-xs font-bold gba-font block mb-1">Nome do Treinador:</label>
                        <input id="trainerNameInput" type="text" placeholder="Ash, Misty, etc." 
                            value="${trainerName}"
                            class="w-full p-2 border-2 border-gray-800 rounded gba-font text-sm text-center bg-white shadow-inner">
                    </div>
                     <div class="mb-6 w-full max-w-xs">
                            <p class="text-xs font-bold gba-font mb-3 text-center">Escolha seu Personagem:</p>
                            <div class="flex justify-center gap-6 sm:gap-10">
                                <!-- Personagem Masculino -->
                                <div onclick="window.selectGender('MALE')" 
                                    class="flex flex-col items-center p-3 border-4 rounded-lg transition-all duration-200 cursor-pointer 
                                    ${
                                      currentGender === "MALE"
                                        ? "border-blue-600 bg-blue-200 shadow-lg"
                                        : "border-gray-300 bg-white hover:bg-gray-200"
                                    }">
                                    <img id="maleTrainerImage" src="https://i.redd.it/3mmmx0dz9nmb1.gif" 
                                        alt="Treinador Masculino" 
                                        class="h-24 object-contain" 
                                        onerror="this.src='https://placehold.co/150x150/38bdf8/fff?text=M'">
                                    <div class="text-xs gba-font mt-1">Homem</div>
                                </div>
                                
                                <!-- Personagem Feminino -->
                                <div onclick="window.selectGender('FEMALE')" 
                                    class="flex flex-col items-center p-3 border-4 rounded-lg transition-all duration-200 cursor-pointer 
                                    ${
                                      currentGender ===
                                      "FEMALE"
                                        ? "border-pink-600 bg-pink-200 shadow-lg"
                                        : "border-gray-300 bg-white hover:bg-gray-200"
                                    }">
                                    <img id="femaleTrainerImage" src="https://i.pinimg.com/564x/6a/dd/3a/6add3a02c42a1e3085599c409fd8013e.jpg" 
                                        alt="Treinadora Feminina" 
                                        class="h-24 object-contain" 
                                        onerror="this.src='https://placehold.co/150x150/f87171/fff?text=F'">
                                    <div class="text-xs gba-font mt-1">Mulher</div>
                                </div>
                            </div>
                        </div>

                    <!-- Conteúdo da lista de iniciais que pode rolar se for muito grande -->
                    <div class="mb-6 w-full max-w-sm flex-grow">
                        <p class="text-xs font-bold gba-font mb-3 mt-6 text-center">Escolha seu Inicial:</p>
                        <div class="flex flex-col sm:flex-row justify-around gap-4"> 
                            ${window.GameConfig.STARTERS.map(
                              (name) => `
                                <div onclick="Renderer.selectStarter('${name}')" class="flex flex-col items-center flex-1 cursor-pointer">
                                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getStarterSpriteKey(
                                      name
                                    )}.png" alt="${name}" 
                                        class="mx-auto w-20 h-20 sm:w-24 sm:h-24 transition-transform duration-200 hover:scale-125">
                                    <div class="text-xs gba-font text-gray-800 mt-2 text-center">${window.Utils.formatName(
                                      name
                                    )}</div>
                                </div>
                            `
                            ).join("")}
                        </div>
                    </div>
                </div>
                <!-- Fim da seção de conteúdo principal -->

                <!-- BOTÃO ESCONDIDO PARA RESETAR DADOS (Canto inferior esquerdo) -->
                <!-- Utiliza confirmação de duplo clique para evitar resets acidentais. -->
                <button 
                    onclick="this.textContent === 'CONFIRMA?' ? window.resetGameData() : (this.textContent = 'CONFIRMA?')"
                    onmouseout="this.textContent = 'RESET';"
                    class="absolute bottom-1 left-1 gba-font text-[8px] text-red-700 bg-red-200 opacity-20 hover:opacity-100 transition-opacity p-1 rounded-sm border border-red-800 shadow-sm"
                    title="Cuidado: Isso apagará TODO o seu progresso!">
                    RESET
                </button>
            </div>
        `;
    Renderer.renderGbaCard(content);
  },

  /** Define o gênero do treinador e recarrega a tela de Initial Menu. */
  selectGender: function (gender) {
    window.gameState.profile.trainerGender = gender;
    // Não precisa de app-container, injeta direto no gba-screen
    Renderer.renderInitialMenu(document.getElementById("app-container")); 
  },

  /** Seleciona o Pokémon inicial, define o nome e inicia o jogo. */
  selectStarter: async function (name) {
    const input = document.getElementById("trainerNameInput");
    const trainerName = input.value.trim();

    if (!trainerName || trainerName.length < 3) {
      window.Utils.showModal(
        "errorModal",
        "Por favor, digite um nome de treinador válido (mínimo 3 caracteres)."
      );
      return;
    }

    window.gameState.profile.trainerName = trainerName.toUpperCase();

    try {
        const starterData = await window.PokeAPI.fetchPokemonData(name);
        if (starterData) {
          window.gameState.profile.pokemon.push(starterData);
          window.Utils.saveGame();
          Renderer.showScreen("mainMenu");
        } else {
          // Garante que se a função retornar null por erro, ele avisa
          window.Utils.showModal(
            "errorModal",
            `Falha ao carregar dados de ${window.Utils.formatName(name)} da PokéAPI. Tente novamente.`
          );
        }
    } catch (error) {
        // Captura qualquer erro de execução, incluindo o que causou o problema original
        window.Utils.showModal(
            "errorModal",
            `Erro ao iniciar jogo: ${error.message.substring(0, 100)}`
        );
        console.error("Erro ao selecionar inicial:", error);
    }
  },

  /** Renderiza a tela principal do jogo (Main Menu). */
  renderMainMenu: function (app) {
    const profile = window.gameState.profile;

    const allFainted =
      profile.pokemon.length > 0 &&
      profile.pokemon.every((p) => p.currentHp <= 0);

    const trainerImage =
      profile.trainerGender === "MALE"
        ? "https://placehold.co/100x100/38bdf8/fff?text=M"
        : "https://placehold.co/100x100/f87171/fff?text=F";

    const statsHtml = `
            <div class="p-2 bg-white border-2 border-gray-800 rounded-lg shadow-inner mb-4 sm:mb-0 sm:h-full flex-shrink-0 sm:flex-shrink">
                <div class="text-sm font-bold text-gray-800 gba-font border-b border-gray-300 pb-1 mb-2">TREINADOR</div>
                <div class="flex items-start">
                    <img src="${trainerImage}" alt="Treinador" class="w-12 h-12 rounded-full border-2 border-gray-400 mr-3">
                    <div class="flex flex-col items-start space-y-1 text-xs gba-font">
                        <p><strong>NOME:</strong> ${profile.trainerName}</p>
                        <p><strong>GÊNERO:</strong> ${
                          profile.trainerGender === "MALE" ? "M" : "F"
                        }</p>
                        <p><strong>DINHEIRO:</strong> P$${profile.money}</p>
                        <p><strong>POKÉS:</strong> ${
                          profile.pokemon.length
                        } / 6</p>
                    </div>
                </div>
            </div>
        `;

    // NOVO MENU PRINCIPAL COM SUBGRUPOS
    const menuHtml = `
            <div class="space-y-2 p-2 h-full flex flex-col justify-start">
                <button onclick="Renderer.showScreen('pokemonMenu')" class="gba-button bg-red-500 hover:bg-red-600">MEU TIME</button>
                <button onclick="Renderer.showScreen('serviceMenu')" class="gba-button bg-cyan-500 hover:bg-cyan-600">SERVIÇOS</button>
                <button onclick="Renderer.showScreen('pvpSetup')" class="gba-button bg-purple-500 hover:bg-purple-600">BATALHA PVP</button>
                <button onclick="Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600">PERFIL E OPÇÕES</button>
            </div>
        `;

    const exploreDisabled = allFainted ? "disabled" : "";
    const exploreMsg = allFainted
      ? '<span class="text-red-500">TODOS DESMAIADOS! Vá para o Centro Pokémon.</span>'
      : window.gameState.exploreLog.slice(-1)[0];

    const exploreHtml = `
            <div class="p-2 bg-white border-2 border-gray-800 rounded-lg shadow-inner flex-shrink-0">
                <div class="text-sm font-bold text-gray-800 gba-font border-b border-gray-300 pb-1 mb-2">EXPLORAÇÃO RÁPIDA</div>
                <!-- Aumentando a altura mínima do h-10 para h-16 para dar mais espaço ao log -->
                <div id="explore-result" class="h-16 text-xs gba-font mb-2 overflow-y-auto">
                    ${exploreMsg}
                </div>
                <button onclick="window.GameLogic.explore()" class="gba-button bg-green-500 hover:bg-green-600 w-full ${exploreDisabled}" ${exploreDisabled}>ANDAR</button>
            </div>
        `;

    const combinedHtml = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">MENU PRINCIPAL</div>
            
            <!-- Top Section: Stats (Left) & Menu (Right) -->
            <!-- Esta seção usa flex-grow para usar o espaço no meio da tela -->
            <div class="flex flex-col sm:flex-row gap-4 mb-4 flex-grow">
                <div class="sm:w-2/5 w-full flex-shrink-0">
                    ${statsHtml}
                </div>
                <div class="sm:w-3/5 w-full flex-shrink-0">
                    ${menuHtml}
                </div>
            </div>

            <!-- Bottom Section: Quick Explore -->
            <div class="flex-shrink-0">
                ${exploreHtml}
            </div>
        `;

    Renderer.renderGbaCard(combinedHtml);
  },

  // --- NOVAS FUNÇÕES DE SUBMENU ---

  /** Renderiza o submenu de Pokémons (Time, Mochila, Pokédex). */
  renderPokemonMenu: function (app) {
    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">MEU TIME</div>
            
            <div class="space-y-4 p-4 flex-grow overflow-y-auto">
                <button onclick="Renderer.showScreen('pokemonList')" class="gba-button bg-red-500 hover:bg-red-600">VER POKÉMONS</button>
                <button onclick="Renderer.showScreen('bag')" class="gba-button bg-yellow-500 hover:bg-yellow-600">MOCHILA</button>
                <button onclick="Renderer.showScreen('pokedex')" class="gba-button bg-orange-500 hover:bg-orange-600">POKÉDEX</button>
            </div>
            
            <button onclick="Renderer.showScreen('mainMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    Renderer.renderGbaCard(content);
  },

  /** Renderiza o submenu de Serviços (Centro, Loja). */
  renderServiceMenu: function (app) {
    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">SERVIÇOS</div>
            
            <div class="space-y-4 p-4 flex-grow overflow-y-auto">
                <button onclick="Renderer.showScreen('healCenter')" class="gba-button bg-pink-500 hover:bg-pink-600">CENTRO POKÉMON</button>
                <button onclick="Renderer.showScreen('shop')" class="gba-button bg-cyan-500 hover:bg-cyan-600">LOJA</button> 
            </div>
            
            <button onclick="Renderer.showScreen('mainMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    Renderer.renderGbaCard(content);
  },

  /** Renderiza o submenu de Perfil e Opções. */
  renderProfileMenu: function (app) {
    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">PERFIL E OPÇÕES</div>
            
            <div class="space-y-4 p-4 flex-grow overflow-y-auto">
                <button onclick="Renderer.showScreen('profile')" class="gba-button bg-blue-500 hover:bg-blue-600">PERFIL DO TREINADOR</button>
                <button onclick="Renderer.showScreen('preferences')" class="gba-button bg-yellow-500 hover:bg-yellow-600">PREFERÊNCIAS</button>
            </div>
            
            <button onclick="Renderer.showScreen('mainMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    Renderer.renderGbaCard(content);
  },
  // --- FIM DAS NOVAS FUNÇÕES DE SUBMENU ---

  /** Renderiza o novo menu de preferências. */
  renderPreferences: function (app) {
      const prefs = window.gameState.profile.preferences;
      const volumePercent = Math.round(prefs.volume * 100);
      const isMuted = prefs.isMuted;
      
      const content = `
          <div class="text-xl font-bold text-center mb-6 text-gray-800 gba-font flex-shrink-0">PREFERÊNCIAS</div>
          
          <div class="p-4 bg-white border-2 border-gray-800 rounded-lg shadow-inner mb-6 flex-grow overflow-y-auto">
              <div class="text-sm font-bold text-gray-800 gba-font mb-4 border-b border-gray-300 pb-2">CONTROLE DE SOM</div>
              
              <!-- Slider de Volume -->
              <div class="mb-6">
                  <label for="volumeSlider" class="block text-xs font-bold gba-font mb-2">
                      Volume da Música: ${volumePercent}%
                  </label>
                  <input type="range" id="volumeSlider" min="0" max="1" step="0.01" value="${prefs.volume}" 
                         oninput="window.Utils.updateVolume(this.value)"
                         class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg">
              </div>

              <!-- Botão Mute -->
              <button onclick="window.Utils.toggleMute()" 
                      class="gba-button w-full ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}">
                  ${isMuted ? 'SOM MUDO (CLIQUE PARA LIGAR)' : 'SOM LIGADO (CLIQUE PARA MUTAR)'}
              </button>
              <p class="text-xs gba-font text-gray-500 mt-2 text-center">(O volume atual do jogo é ${isMuted ? 'MUDO' : 'LIGADO'})</p>

          </div>
          
          <button onclick="Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
      `;
    Renderer.renderGbaCard(content);
  },

  /** Renderiza a lista de Pokémons do jogador. */
  renderPokemonList: function (app) {
    const pokemonArray = window.gameState.profile.pokemon;

    

    const pokemonHtml = pokemonArray
      .map(
        (p, index) => { 
          const expToNextLevel = window.Utils.calculateExpToNextLevel(p.level);
          const expPercent = Math.min(100, (p.exp / expToNextLevel) * 100);
          
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
            <div class="flex items-center flex-grow min-w-0 p-1 cursor-pointer" onclick="Renderer.showPokemonStats('${p.name}', ${index})">
                <img src="${p.sprite}" alt="${
          p.name
        }" class="w-16 h-16 sm:w-20 sm:h-20 mr-2 flex-shrink-0">
                <!-- Ajuste de Layout: flex-col para empilhar HP e EXP, e text-xs para caber em telas pequenas -->
                <div class="flex flex-col min-w-0">
                    <div class="font-bold gba-font text-xs sm:text-sm truncate">${p.name} </div>
                    <div class="text-[8px] sm:text-xs gba-font flex flex-col sm:flex-row sm:space-x-2">
                      <span>(Nv. ${p.level})</span>
                      <span>HP: ${p.currentHp}/${p.maxHp}</span>
                      <div class="p-2 flex items-center w-full mt-1 ml-4 sm:ml-20">
                        <span class="gba-font text-[8px] mr-1 text-gray-700">EXP</span>
                        <div class="w-full bg-gray-300 h-1.5 rounded-full border border-gray-500">
                            <div class="h-1.5 rounded-full bg-blue-500 transition-all duration-500" 
                                 style="width: ${expPercent}%;"></div>
                        </div>
                        <span class="gba-font text-[8px] ml-2 text-gray-700">${Math.floor(expPercent)}%</span>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    `;
  }
      )
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
        <button onclick="Renderer.showScreen('managePokemon')" class="gba-button bg-cyan-500 hover:bg-cyan-600 w-full mb-2 flex-shrink-0">Gerenciar Pokémons</button>
        <button onclick="Renderer.showScreen('pokemonMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
    `;
    Renderer.renderGbaCard(content);
  },
  
  /** Renderiza a tela de gerenciamento (soltar e evoluir Pokémons). */
  renderManagePokemon: function (app) {
    const pokemonArray = window.gameState.profile.pokemon;
    const evolutionCost = window.GameConfig.EVOLUTION_COST;
    const requiredExp = 1000; // Nova regra: 1000 EXP
    
    // Lista SIMULADA de Pokémons de estágio final que não podem evoluir.
    const FINAL_EVOLUTIONS = [
        'venusaur', 'charizard', 'blastoise', 'butterfree', 'beedrill', 
        'pidgeot', 'raticate', 'fearow', 'arbok', 'raichu', 'sandslash', 
        'nidoking', 'nidoqueen', 'clefable', 'ninetales', 'wigglytuff',
        'vileplume', 'poliwrath', 'alakazam', 'machamp', 'golem', 
        'slowbro', 'gengar', 'onix', 'hypno', 'kingler', 'hitmonlee', 
        'hitmonchan', 'chansey', 'tangela', 'scyther', 'jynx', 
        'electabuzz', 'magmar', 'pinsir', 'tauros', 'gyarados', 
        'lapras', 'ditto', 'eevee', 'vaporeon', 'jolteon', 'flareon', 
        'porygon', 'omastar', 'kabutops', 'snorlax', 'dragonite', 'mewtwo', 'mew',
        'porygon-z', 
    ].map(name => name.toLowerCase());


    const pokemonHtml = pokemonArray
      .map((p, index) => {
        const isCurrentlyActive = index === 0;
        const canRelease = pokemonArray.length > 1;
        const pokemonNameLower = p.name.toLowerCase();
        
        // 1. Checagem de Estágio Final
        const isMaxEvolution = FINAL_EVOLUTIONS.includes(pokemonNameLower);
        
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
        
        // Ajuste no layout para mobile:
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
                            } (Nv. ${p.level}) ${isCurrentlyActive ? '<span class="text-[8px] text-green-600">(Ativo)</span>' : ''}</div>
                            <div class="text-[8px] gba-font">HP: ${
                              p.currentHp
                            }/${p.maxHp} | EXP: ${p.exp}/${requiredExp}</div>
                        </div>
                    </div>
                    
                    <!-- Contêiner dos Botões (Empilha verticalmente em mobile, fica lado a lado em desktop) -->
                    <div class="flex space-x-2 w-full sm:w-1/2 justify-end">
                        <!-- NOVO BOTÃO 'USAR' / 'ATIVO' -->
                        <button onclick="${isCurrentlyActive ? '' : `window.GameLogic.setPokemonAsActive(${index})`}"
                            class="gba-button text-xs w-1/4 h-12 ${isCurrentlyActive ? 'bg-green-600 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}"
                            ${isCurrentlyActive ? "disabled" : ""}>
                            ${isCurrentlyActive ? 'ATIVO' : 'USAR'}
                        </button>
                        
                        <button onclick="${canEvolve ? `window.GameLogic.evolvePokemon(${index})` : ""}"
                            class="gba-button text-xs h-12 ${evolveButtonClass}"
                            ${isDisabledEvolve ? "disabled" : ""}>
                            ${evolveButtonText}
                        </button>
                        
                        <button onclick="${
                          canRelease ? `window.GameLogic.releasePokemon(${index})` : ""
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
      })
      .join("");

    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">GERENCIAR POKÉMONS</div>
            <!-- flex-grow e overflow-y-auto para a lista de gerenciamento -->
            <div class="flex-grow overflow-y-auto border border-gray-400 p-2 mb-4 bg-white">${pokemonHtml}</div>
            <button onclick="Renderer.showScreen('pokemonList')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    Renderer.renderGbaCard(content);
  },

  /** Exibe o modal de estatísticas detalhadas do Pokémon. */
  showPokemonStats: async function (pokemonName, index) {
    const pokemon = window.gameState.profile.pokemon[index];
    if (!pokemon) {
      window.Utils.showModal("errorModal", "Pokémon não encontrado!");
      return;
    }

    const healItem = window.gameState.profile.items.find(i => i.healAmount);
    const isHealItemAvailable = healItem && healItem.quantity > 0;
    const expToNextLevel = window.Utils.calculateExpToNextLevel(pokemon.level);
    const expPercent = Math.min(100, (pokemon.exp / expToNextLevel) * 100);
    const movesHtml = pokemon.moves
      .map((move) => `<li class="text-sm">${window.Utils.formatName(move)}</li>`)
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
                <span class="text-xs gba-font">${window.Utils.formatName(stat)}:</span>
                <span class="text-xs gba-font">${value}</span>
            </div>
        `
      )
      .join("");

    const modalContent = `
            <div class="text-xl font-bold text-gray-800 gba-font mb-4 text-center flex-shrink-0">
                ${pokemon.name}
            </div>
            <img src="${pokemon.sprite}" alt="${pokemon.name}" class="w-32 h-32 mx-auto mb-4 flex-shrink-0">
            
            <div class="text-center mb-2 flex-shrink-0">${typesHtml}</div>
            
            <div class="text-left gba-font text-xs flex-shrink-0">
                <p><strong>Nível:</strong> ${pokemon.level}</p>
                <p><strong>HP:</strong> ${pokemon.currentHp}/${pokemon.maxHp}</p>
                <div class="mt-2 flex items-center">
                    <span class="gba-font text-[10px] mr-2">EXP</span>
                    <div class="w-full bg-gray-300 h-2 rounded-full border border-gray-500">
                        <div class="h-2 rounded-full bg-blue-500 transition-all duration-500" 
                             style="width: ${expPercent}%;"></div>
                    </div>
                </div>
                 <p class="text-[8px] text-gray-700 mt-1">Progresso: ${pokemon.exp} / ${expToNextLevel}</p>
            </div>
            
            <div class="mt-4 p-2 border-t border-gray-400 flex-grow overflow-y-auto">
                <h3 class="font-bold gba-font text-sm mb-2">Estatísticas Base:</h3>
                ${statsHtml}
                <h3 class="font-bold gba-font text-sm mb-2 mt-4">Ataques:</h3>
                <ul class="list-disc list-inside gba-font text-xs">
                    ${movesHtml}
                </ul>
            </div>
            
            ${isHealItemAvailable && healItem
            ? `
                <button onclick="window.Utils.hideModal('pokemonStatsModal'); window.GameLogic.useItem('${healItem.name}', ${index})" class="gba-button bg-green-500 hover:bg-green-600 mt-4 w-full mb-2 flex-shrink-0">
                    Usar ${healItem.name} (x${healItem.quantity})
                </button>
                `
            : ''}
            
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

  /** Exibe o modal de estatísticas detalhadas do Pokémon (apenas visualização). */
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
                <p class="mt-2 text-sm">#${pokemonId.toString().padStart(3, '0')}</p>
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
    const pokemonData = await window.PokeAPI.fetchPokemonData(pokemonId, true);
    
    if (!pokemonData) {
        window.Utils.showModal("errorModal", "Dados do Pokémon não encontrados!");
        return;
    }

    const movesHtml = pokemonData.moves
      .map((move) => `<li class="text-sm">${window.Utils.formatName(move)}</li>`)
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
                <span class="text-xs gba-font">${window.Utils.formatName(stat)}:</span>
                <span class="text-xs gba-font">${value}</span>
            </div>
        `
      )
      .join("");

    const modalContent = `
            <div class="text-xl font-bold text-gray-800 gba-font mb-4 text-center flex-shrink-0">
                #${pokemonData.id.toString().padStart(3, '0')} - ${pokemonData.name}
            </div>
            <img src="${pokemonData.sprite}" alt="${pokemonData.name}" class="w-32 h-32 mx-auto mb-4 flex-shrink-0">
            
            <div class="text-center mb-2 flex-shrink-0">${typesHtml}</div>
            
            <div class="text-left gba-font text-xs flex-shrink-0">
                <p><strong>HP Base:</strong> ${pokemonData.maxHp}</p>
            </div>
            
            <div class="mt-4 p-2 border-t border-gray-400 flex-grow overflow-y-auto">
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

  /** Renderiza a tela de Pokedex. */
  renderPokedex: function (app) {
    const pokedexSet = window.gameState.profile.pokedex;
    const pokedexHtml = [];
    const totalCaught = pokedexSet.size;
    const totalAvailable = window.GameConfig.POKEDEX_LIMIT;

    for (let id = 1; id <= totalAvailable; id++) {
        const isCaught = pokedexSet.has(id);
        const displayId = id.toString().padStart(3, '0');
        
        let displayUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
        let displayName = `???`;
        let filterStyle = 'filter: grayscale(100%) brightness(0);';
        
        // Se capturado, exibe o sprite colorido e o nome.
        if (isCaught) {
            filterStyle = '';
            // Tenta obter o nome se estiver no time, senão usa o ID para formatação
            // Nota: Para a visualização de grade, usamos o ID e um nome temporário/abreviado para economizar espaço
            displayName = `ID #${displayId}`; 
            // Para mostrar o nome de verdade, a API teria que ser chamada, mas isso pode ser muito lento para a grade inteira.
            // Por enquanto, usamos ID para o título do bloco.
        }

        pokedexHtml.push(`
            <div onclick="Renderer.showPokedexStats(${id}, ${!isCaught})" 
                 class="flex flex-col items-center p-1 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors duration-100 bg-white">
                <img src="${displayUrl}" alt="Pokemon #${id}" class="w-12 h-12 mb-1" style="${filterStyle}">
                
                <!-- Nome/ID e Nível/HP (Placeholder para escala de grade) -->
                <div class="text-center w-full truncate">
                    <span class="gba-font text-[7px] font-bold ${isCaught ? 'text-gray-800' : 'text-gray-400'}">${isCaught ? window.Utils.formatName(window.gameState.profile.pokemon.find(p => p.id === id)?.name || `POKE #${displayId}`) : '???' }</span>
                    <div class="text-[6px] gba-font text-gray-600 mt-1 truncate">
                       ${isCaught ? `(Nv. ${window.gameState.profile.pokemon.find(p => p.id === id)?.level || '?'})` : '(DESCONHECIDO)'}
                    </div>
                </div>
            </div>
        `);
    }
    
    // Converte o array de HTML para uma string única
    const gridHtml = pokedexHtml.join('');

    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">POKÉDEX</div>
            
            <!-- Contador de Registros -->
            <div class="text-center text-sm gba-font mb-4 flex-shrink-0">
                REGISTRADOS: ${totalCaught} / ${totalAvailable}
            </div>
            
            <!-- Grid de Pokémons (3 Colunas, responsivo) -->
            <div class="flex-grow overflow-y-auto border border-gray-400 p-0 mb-4 bg-gray-100">
                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1 p-1">
                    ${gridHtml}
                </div>
            </div>
            <button onclick="Renderer.showScreen('pokemonMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    Renderer.renderGbaCard(content);
  },

  /** Renderiza a tela de Mochila (Bag). */
  renderBag: function (app, extraData = {}) {
    let itemsHtml = window.gameState.profile.items
      .map((item) => {
        let actionText = "";

        if (item.healAmount && item.quantity > 0) {
          actionText = `<span class="text-xs text-green-600 gba-font ml-2">(Cura)</span>`;
        } else if (item.catchRate) {
          actionText = `<span class="text-xs text-blue-600 gba-font ml-2">(Captura)</span>`;
        }

        return `
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 border-b border-gray-300 flex-shrink-0">
                    <span class="gba-font">${item.name}</span>
                    <span class="gba-font">x${item.quantity} ${actionText}</span>
                </div>
            `;
      })
      .join("");

    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">MOCHILA</div>
            <p class="text-center text-sm gba-font mb-4 flex-shrink-0">Itens de Cura podem ser usados na Lista de Pokémons.</p>
            <!-- flex-grow e overflow-y-auto para a lista de itens -->
            <div class="flex-grow overflow-y-auto border border-gray-400 p-2 mb-4 bg-white">${
              itemsHtml ||
              '<p class="text-center text-gray-500 gba-font">Mochila vazia!</p>'
            }</div>
            <button onclick="Renderer.showScreen('pokemonMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    Renderer.renderGbaCard(content);
  },

  /** Renderiza a tela de Perfil do Treinador. */
  renderProfile: function (app) {
    const profile = window.gameState.profile;
    const trainerImage =
      profile.trainerGender === "MALE"
        ? "https://placehold.co/100x100/38bdf8/fff?text=TREINADOR"
        : "https://placehold.co/100x100/f87171/fff?text=TREINADORA";

    const content = `
        <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">PERFIL DO TREINADOR</div>
        <div class="flex flex-col items-center justify-center mb-4 flex-shrink-0">
        <img src="${trainerImage}" alt="Imagem do Treinador" class="w-20 h-20 rounded-full border-4 border-gray-800">
        </div>
        <!-- Esta seção usa flex-grow e overflow-y-auto para permitir rolagem no meio da tela -->
        <div class="space-y-3 text-sm gba-font flex-grow overflow-y-auto p-2">
        <div>
            <label for="newTrainerName" class="block text-xs font-bold mb-1">Nome:</label>
            <input id="newTrainerName" type="text" value="${
              profile.trainerName
            }"
            class="w-full p-2 border-2 border-gray-800 rounded gba-font text-sm text-center bg-white shadow-inner uppercase">
        </div>
        <div>
            <p class="text-xs font-bold mb-1">Gênero:</p>
            <div class="flex justify-center space-x-4 text-xs">
            <label class="flex items-center space-x-1">
                <input type="radio" name="newTrainerGender" value="MALE" ${
                  profile.trainerGender === "MALE" ? "checked" : ""
                } onclick="Renderer.selectGender('MALE')">
                <span>Homem</span>
            </label>
            <label class="flex items-center space-x-1">
                <input type="radio" name="newTrainerGender" value="FEMALE" ${
                  profile.trainerGender === "FEMALE" ? "checked" : ""
                } onclick="Renderer.selectGender('FEMALE')">
                <span>Mulher</span>
            </label>
            </div>
        </div>
        <p><strong>Dinheiro:</strong> P$${profile.money}</p>
        <p><strong>Pokémons:</strong> ${profile.pokemon.length}</p>
        <p><strong>ID de Jogador:</strong> ${window.userId}</p>
        </div>
        <div class="mt-4 flex-shrink-0">
        <button onclick="window.GameLogic.saveProfile()" class="gba-button bg-green-500 hover:bg-green-600 w-full mb-2">Salvar Perfil</button>
        </div>
    
                <div class="mt-4 border-t-2 border-gray-800 pt-4 flex-shrink-0">
        <button onclick="window.GameLogic.exportSave()" class="gba-button bg-blue-500 hover:bg-blue-600 w-full mb-2">Exportar Save</button>
        <div class="relative">
            <input type="file" id="importFile" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onchange="window.GameLogic.importSave(event)">
            <button class="gba-button bg-orange-500 hover:bg-orange-600 w-full">Importar Save</button>
        </div>
        </div>
    
        <button onclick="Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full mt-4 flex-shrink-0">Voltar</button>
    `;
    Renderer.renderGbaCard(content);
  },

  /** Renderiza a tela de Centro Pokémon. */
  renderHealCenter: function (app) {
    const profile = window.gameState.profile;
    // O valor de GameConfig está disponível globalmente através do módulo app.js
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
            <button onclick="Renderer.showScreen('serviceMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    Renderer.renderGbaCard(content);
  },

  /** Renderiza a tela de Loja. */
  renderShop: function (app) {
    const GameConfig = window.GameConfig;

    /**
     * Atualiza o subtotal de um item na loja
     * @param {string} inputId ID do campo de input de quantidade
     * @param {number} itemCost Custo unitário do item
     */
    function updateSubtotal(inputId, itemCost) {
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
                    buyButton.classList.add('bg-gray-400');
                    buyButton.classList.remove('bg-green-500', 'hover:bg-green-600');
                } else {
                    buyButton.disabled = false;
                    buyButton.classList.remove('bg-gray-400');
                    buyButton.classList.add('bg-green-500', 'hover:bg-green-600');
                }
            }
        }
    }
    
    // Exporta a função para o escopo global para que os botões possam acessá-la
    window.updateSubtotal = updateSubtotal;

    const shopItemsHtml = GameConfig.SHOP_ITEMS.map(
      (item) => {
        // ID único para o campo de quantidade (remove espaços para ser um ID HTML válido)
        const inputId = `qty-${item.name.replace(/\s/g, "")}`;
        const buyBtnId = `buy-btn-${inputId}`;
        const initialSubtotal = item.cost * 1;
        
        const isAffordable = window.gameState.profile.money >= initialSubtotal;
        
        return `
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 border-b border-gray-300 flex-shrink-0">
              <!-- Item Name and Cost -->
              <div class="flex-grow min-w-0">
                <span class="gba-font text-xs sm:text-sm">${item.name}</span>
                <span class="gba-font text-[10px] sm:text-xs text-gray-600 block sm:inline"> (P$${item.cost} cada)</span>
                <!-- Subtotal dinâmico -->
                <div id="subtotal-${inputId}" class="gba-font text-xs text-yellow-700 font-bold mt-1">
                    Subtotal: P$${initialSubtotal}
                </div>
              </div>

              <!-- Quantity Input and Button Group -->
              <div class="flex items-center space-x-1 flex-shrink-0 w-full sm:w-auto">
                
                <!-- Botão Decrementar -->
                <button onclick="document.getElementById('${inputId}').value = Math.max(1, parseInt(document.getElementById('${inputId}').value) - 1); window.updateSubtotal('${inputId}', ${item.cost});"
                        class="w-8 h-8 gba-button bg-red-400 hover:bg-red-500 p-0 text-xl leading-none">-</button>
                
                <!-- Input de Quantidade -->
                <input id="${inputId}" type="number" value="1" min="1" max="99"
                    oninput="window.updateSubtotal('${inputId}', ${item.cost})"
                    class="w-16 p-1 border-2 border-gray-400 rounded gba-font text-sm text-center bg-white shadow-inner">
                
                <!-- Botão Incrementar -->
                <button onclick="document.getElementById('${inputId}').value = Math.min(99, parseInt(document.getElementById('${inputId}').value) + 1); window.updateSubtotal('${inputId}', ${item.cost});"
                        class="w-8 h-8 gba-button bg-blue-400 hover:bg-blue-500 p-0 text-xl leading-none">+</button>

                <!-- Botão Comprar -->
                <button id="${buyBtnId}"
                        onclick="window.GameLogic.buyItem('${item.name}', document.getElementById('${inputId}').value)" 
                        class="gba-button text-xs w-24 h-8 ${isAffordable ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400'}"
                        ${isAffordable ? '' : 'disabled'}>
                    Comprar
                </button>
              </div>
            </div>
        `;
      }
    ).join("");

    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">LOJA</div>
            <p class="text-center text-sm gba-font mb-4 flex-shrink-0">Seu Dinheiro: P$${window.gameState.profile.money}</p>
            <!-- flex-grow e overflow-y-auto para a lista de compras -->
            <div class="flex-grow overflow-y-auto border border-gray-400 p-2 mb-4 bg-white">${shopItemsHtml}</div>
            <button onclick="Renderer.showScreen('serviceMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    Renderer.renderGbaCard(content);
  },

  /** Renderiza a tela de Setup PvP. */
  renderPvpSetup: function (app) {
    // O valor de PvpCore está disponível globalmente através do módulo app.js
    const PvpCore = window.PvpCore;
    
    let messages = "Escolha uma opção.";
    let disabledClass = "";

    if (!PvpCore.isPvpEnabled()) {
      messages =
        '<span class="text-red-600">O PvP está desativado. Chaves Firebase de Configuração não encontradas.</span>';
      disabledClass = "opacity-50 cursor-not-allowed";
    }

    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">BATALHA PVP</div>
            <!-- flex-grow para a área de mensagens -->
            <div id="pvp-messages" class="h-16 p-2 mb-4 bg-white border-2 border-gray-400 rounded overflow-y-auto text-sm gba-font flex-grow">
                ${messages}
            </div>
            <button onclick="window.PvpCore.createPvpLink()" class="gba-button bg-purple-500 hover:bg-purple-600 w-full mb-2 flex-shrink-0 ${disabledClass}" ${
      !PvpCore.isPvpEnabled() ? "disabled" : ""
    }>Criar Sala de Batalha</button>
            <input id="pvpRoomInput" type="text" placeholder="ID da Sala para Entrar" class="w-full p-2 mb-4 border-2 border-gray-400 rounded gba-font text-sm flex-shrink-0 ${disabledClass}" ${
      !PvpCore.isPvpEnabled() ? "disabled" : ""
    }>
            <button onclick="window.PvpCore.joinPvpBattle(document.getElementById('pvpRoomInput').value.trim())" class="gba-button bg-orange-500 hover:bg-orange-600 w-full mb-2 flex-shrink-0 ${disabledClass}" ${
      !PvpCore.isPvpEnabled() ? "disabled" : ""
    }>Entrar em Batalha</button>
            <button onclick="Renderer.showScreen('mainMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    Renderer.renderGbaCard(content);
  },

  /** Renderiza a tela de espera PvP. */
  renderPvpWaiting: function (roomId) {
    // O valor de PvpCore está disponível globalmente através do módulo app.js
    const PvpCore = window.PvpCore;

    const app = document.getElementById("app-container");
    if (!app) return;
    
    // Injeta o conteúdo no gba-screen que já existe no DOM
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
            <button onclick="Renderer.showScreen('mainMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar ao Menu</button>
        `;
    gbaScreen.innerHTML = content;
  },

  /** Renderiza a tela de batalha e inicia a UI. */
  renderBattleScreen: function (app) {
    // O valor de BattleCore está disponível globalmente através do módulo app.js
    const BattleCore = window.BattleCore;

    // Apenas define a estrutura básica no gba-screen (o card) e injeta o battleArea.
    const gbaScreen = document.querySelector(".gba-screen");
    if (gbaScreen) {
        // Usa flex-col h-full no battle-area para que o conteúdo (sprites, log, botões)
        // se ajuste verticalmente dentro do gba-screen
        gbaScreen.innerHTML = `<div id="battle-area" class="flex flex-col h-full"></div>`;
    }
    // O BattleCore.updateBattleScreen preenche o #battle-area
    window.BattleCore.updateBattleScreen();
  },
  
  /** Renderiza a tela para troca de Pokémon durante a batalha. */
  renderSwitchPokemon: function (app) {
    // O valor de BattleCore está disponível globalmente através do módulo app.js
    const BattleCore = window.BattleCore;

    if (!window.gameState.battle) return Renderer.showScreen("mainMenu");

    const activeIndex = window.gameState.battle.playerPokemonIndex;

    const pokemonHtml = window.gameState.profile.pokemon
      .map((p, index) => {
        const isFainted = p.currentHp <= 0;
        const isActive = index === activeIndex;
        const canSelect = !isActive && !isFainted;

        let buttonText = "";
        let buttonClass = "";

        if (isActive) {
          buttonText = "ATIVO";
          buttonClass = "bg-blue-300 cursor-not-allowed";
        } else if (isFainted) {
          buttonText = "DESMAIADO";
          buttonClass = "bg-gray-400 cursor-not-allowed";
        } else {
          buttonText = "TROCAR";
          buttonClass = "bg-green-500 hover:bg-green-600";
        }

        return `
                <div class="flex items-center justify-between p-2 border-b border-gray-300 ${
                  isFainted ? "opacity-70" : ""
                } flex-shrink-0">
                    <div class="flex items-center">
                        <img src="${p.sprite}" alt="${
          p.name
        }" class="w-10 h-10 mr-2">
                        <div>
                            <div class="font-bold gba-font">${
                              p.name
                            } </div>
                            <div class="text-xs gba-font">
                            (Nv. ${p.level})
                            HP: ${
                              p.currentHp
                            }/${p.maxHp}</div>
                        </div>
                    </div>
                    <button 
                        onclick="${
                          canSelect ? `window.BattleCore.switchPokemon(${index})` : ""
                        }" 
                        class="gba-button w-24 h-8 ${buttonClass}" 
                        ${!canSelect ? "disabled" : ""}>
                        ${buttonText}
                    </button>
                </div>
            `;
      })
      .join("");

    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">TROCAR POKÉMON</div>
            <!-- flex-grow e overflow-y-auto para a lista de Pokémons para troca -->
            <div class="flex-grow overflow-y-auto border border-gray-400 p-2 mb-4 bg-white">${pokemonHtml}</div>
            <button onclick="Renderer.showScreen('battle')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    Renderer.renderGbaCard(content);
  }
};
