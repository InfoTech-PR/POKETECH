export const Renderer = {
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
      case "starterSelection":
        Renderer.renderStarterSelection(app);
        break;
      case "friendshipMenu":
        Renderer.renderFriendshipMenu(app);
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
        // NOVO: Passa o estado de busca/filtro (se existir)
        Renderer.renderPokedex(app, extraData);
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

  renderGbaCard: function (contentHtml) {
    // Encontra o elemento gba-screen que já existe no DOM (graças ao index.html)
    const gbaScreen = document.querySelector(".gba-screen");
    if (gbaScreen) {
      gbaScreen.innerHTML = contentHtml;
    } else {
      console.error(
        "Elemento .gba-screen não encontrado para renderizar card."
      );
    }
  },

  renderInitialMenu: function (app) {
    // Esta tela só terá a opção de login
    const content = `
            <div class="h-full w-full flex flex-col justify-between relative">
                <div class="flex-grow flex flex-col items-center p-4 overflow-y-auto">
                    <div class="flex justify-center mb-4 flex-shrink-0">
                        <img id="titleImage" src="https://64.media.tumblr.com/a1e87d2030a73aee16661e8807da6c1d/tumblr_mkhnmmFwaA1rxvkeso1_500.gif" alt="Título do Jogo" class="w-full max-w-sm" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <h1 class="text-3xl font-bold text-gray-800 gba-font" style="display:none;">POKÉMON RPG</h1>
                    </div>
                    
                    <div class="mt-8 flex flex-col space-y-4 w-full max-w-xs mx-auto">
                        <button
                            onclick="window.signInWithGoogle()"
                            class="gba-button bg-blue-500 hover:bg-blue-600 flex items-center justify-center space-x-2"
                        >
                            <i class="fa-brands fa-google"></i>
                            <span>LOGIN COM GOOGLE</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    Renderer.renderGbaCard(content);
  },

  renderStarterSelection: function (app) {
    const trainerName = window.gameState.profile.trainerName;
    const currentGender = window.gameState.profile.trainerGender;

    // NOVO: Mapeamento dos nomes para os IDs das sprites
    const starterSpriteIds = {
      bulbasaur: 1,
      charmander: 4,
      squirtle: 7,
    };

    const content = `
            <div class="h-full w-full flex flex-col justify-between relative">
                <div class="flex-grow flex flex-col items-center p-4 overflow-y-auto">
                    <div class="mb-4 flex-shrink-0 w-full max-w-xs">
                        <label for="trainerNameInput" class="text-xs font-bold gba-font block mb-1">Nome do Treinador:</label>
                        <input id="trainerNameInput" type="text" placeholder="Ash, Misty, etc." 
                            value="${trainerName}"
                            class="w-full p-2 border-2 border-gray-800 rounded gba-font text-sm text-center bg-white shadow-inner">
                    </div>
                    <div class="mb-6 w-full max-w-xs">
                        <p class="text-xs font-bold gba-font mb-3 text-center">Escolha seu Personagem:</p>
                        <div class="flex justify-center gap-6 sm:gap-10">
                            <div onclick="Renderer.selectGender('MALE')" 
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
                            <div onclick="Renderer.selectGender('FEMALE')" 
                                class="flex flex-col items-center p-3 border-4 rounded-lg transition-all duration-200 cursor-pointer 
                                ${
                                  currentGender === "FEMALE"
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

                    <div class="mb-6 w-full max-w-sm flex-grow">
                        <p class="text-xs font-bold gba-font mb-3 mt-6 text-center">Escolha seu Inicial:</p>
                        <div class="flex flex-col sm:flex-row justify-around gap-4"> 
                            ${window.GameConfig.STARTERS.map(
                              (name) => `
                                <div onclick="Renderer.selectStarter('${name}')" class="flex flex-col items-center flex-1 cursor-pointer">
                                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${
                                      starterSpriteIds[name]
                                    }.png" alt="${name}" 
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
            </div>
        `;
    Renderer.renderGbaCard(content);
  },

  selectGender: function (gender) {
    window.gameState.profile.trainerGender = gender;
    // Não precisa de app-container, injeta direto no gba-screen
    Renderer.renderInitialMenu(document.getElementById("app-container"));
  },

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

        // NOVO: Salva o novo perfil no Firestore e redireciona.
        window.GameLogic.saveProfile();
        window.Renderer.showScreen("mainMenu");
      } else {
        window.Utils.showModal(
          "errorModal",
          `Falha ao carregar dados de ${window.Utils.formatName(
            name
          )} da PokéAPI. Tente novamente.`
        );
      }
    } catch (error) {
      window.Utils.showModal(
        "errorModal",
        `Erro ao iniciar jogo: ${error.message.substring(0, 100)}`
      );
      console.error("Erro ao selecionar inicial:", error);
    }
  },

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

    const menuHtml = `
            <div class="space-y-2 p-2 h-full flex flex-col justify-start">
                <button onclick="Renderer.showScreen('pokemonMenu')" class="gba-button bg-red-500 hover:bg-red-600">MEU TIME</button>
                <button onclick="Renderer.showScreen('serviceMenu')" class="gba-button bg-cyan-500 hover:bg-cyan-600">SERVIÇOS</button>
                <button onclick="Renderer.showScreen('pvpSetup')" class="gba-button bg-purple-500 hover:bg-purple-600">BATALHA PVP</button>
                <button onclick="Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600">PERFIL E OPÇÕES</button>
            </div>
        `;

    const exploreDisabled = allFainted ? "disabled" : "";

    // CORREÇÃO AQUI: Define uma mensagem padrão se o exploreLog estiver vazio.
    const exploreLog = window.gameState.exploreLog || [];
    const exploreMsg = allFainted
      ? '<span class="text-red-500">TODOS DESMAIADOS! Vá para o Centro Pokémon.</span>'
      : // Se o log não estiver vazio, pega o último item. Se estiver, usa a mensagem padrão.
      exploreLog.length > 0
      ? exploreLog.slice(-1)[0]
      : "O que você fará?";

    const exploreHtml = `
            <div class="p-2 bg-white border-2 border-gray-800 rounded-lg shadow-inner flex-shrink-0">
                <div class="text-sm font-bold text-gray-800 gba-font border-b border-gray-300 pb-1 mb-2">EXPLORAÇÃO RÁPIDA</div>
                <div id="explore-result" class="h-16 text-xs gba-font mb-2 overflow-y-auto">
                    ${exploreMsg}
                </div>
                <button onclick="window.GameLogic.explore()" class="gba-button bg-green-500 hover:bg-green-600 w-full ${exploreDisabled}" ${exploreDisabled}>ANDAR</button>
            </div>
        `;

    const combinedHtml = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">MENU POKÉTECH</div>
            <div class="flex flex-col sm:flex-row gap-4 mb-4 flex-grow">
                <div class="sm:w-2/5 w-full flex-shrink-0">
                    ${statsHtml}
                </div>
                <div class="sm:w-3/5 w-full flex-shrink-0">
                    ${menuHtml}
                </div>
            </div>
            <div class="flex-shrink-0">
                ${exploreHtml}
            </div>
        `;

    Renderer.renderGbaCard(combinedHtml);
  },

  renderProfileMenu: function (app) {
    const content = `
      <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">PERFIL E OPÇÕES</div>
    
      <div class="space-y-4 p-4 flex-grow overflow-y-auto">
      <button onclick="Renderer.showScreen('profile')" class="gba-button bg-blue-500 hover:bg-blue-600">PERFIL DO TREINADOR</button>
      <button onclick="Renderer.showScreen('friendshipMenu')" class="gba-button bg-orange-500 hover:bg-orange-600">AMIZADES</button>
      <button onclick="Renderer.showScreen('preferences')" class="gba-button bg-yellow-500 hover:bg-yellow-600">PREFERÊNCIAS</button>
      </div>
    
      <button onclick="Renderer.showScreen('mainMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
    `;
    Renderer.renderGbaCard(content);
  },

  renderFriendshipMenu: function (app) {
    const content = `
    <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">AMIGOS</div>
    
    <div class="space-y-4 p-4 flex-grow overflow-y-auto">
      <button onclick="window.showFriendListModal()" class="gba-button bg-blue-500 hover:bg-blue-600">LISTA DE AMIGOS</button>
      <input id="friendIdInput" type="text" placeholder="ID do Amigo para Enviar" class="w-full p-2 border-2 border-gray-800 rounded gba-font text-sm text-center bg-white shadow-inner">
      <button onclick="window.sendFriendRequest(document.getElementById('friendIdInput').value)" class="gba-button bg-green-500 hover:bg-green-600">ENVIAR PEDIDO</button>
    </div>
    
    <button onclick="Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
    `;
    Renderer.renderGbaCard(content);
  },

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
                  <input type="range" id="volumeSlider" min="0" max="1" step="0.01" value="${
                    prefs.volume
                  }" 
                         oninput="window.Utils.updateVolume(this.value)"
                         class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg">
              </div>

              <!-- Botão Mute -->
              <button onclick="window.Utils.toggleMute()" 
                      class="gba-button w-full ${
                        isMuted
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      }">
                  ${
                    isMuted
                      ? "SOM MUDO (CLIQUE PARA LIGAR)"
                      : "SOM LIGADO (CLIQUE PARA MUTAR)"
                  }
              </button>
              <p class="text-xs gba-font text-gray-500 mt-2 text-center">(O volume atual do jogo é ${
                isMuted ? "MUDO" : "LIGADO"
              })</p>

          </div>
          
          <button onclick="Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
      `;
    Renderer.renderGbaCard(content);
  },

  renderPokemonList: function (app) {
    const pokemonArray = window.gameState.profile.pokemon;

    const pokemonHtml = pokemonArray
      .map((p, index) => {
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
            <div class="flex items-center flex-grow min-w-0 p-1 cursor-pointer" onclick="Renderer.showPokemonStats('${
              p.name
            }', ${index})">
                <img src="${p.sprite}" alt="${
          p.name
        }" class="w-16 h-16 sm:w-20 sm:h-20 mr-2 flex-shrink-0">
                <!-- Ajuste de Layout: flex-col para empilhar HP e EXP, e text-xs para caber em telas pequenas -->
                <div class="flex flex-col min-w-0">
                    <div class="font-bold gba-font text-xs sm:text-sm truncate">${
                      p.name
                    } </div>
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
        <button onclick="Renderer.showScreen('managePokemon')" class="gba-button bg-cyan-500 hover:bg-cyan-600 w-full mb-2 flex-shrink-0">Gerenciar Pokémons</button>
        <button onclick="Renderer.showScreen('pokemonMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
    `;
    Renderer.renderGbaCard(content);
  },

  renderManagePokemon: function (app) {
    const pokemonArray = window.gameState.profile.pokemon;
    const evolutionCost = window.GameConfig.EVOLUTION_COST;
    const requiredExp = 1000; // Nova regra: 1000 EXP

    // Lista SIMULADA de Pokémons de estágio final que não podem evoluir.
    const FINAL_EVOLUTIONS = [
      "venusaur",
      "charizard",
      "blastoise",
      "butterfree",
      "beedrill",
      "pidgeot",
      "raticate",
      "fearow",
      "arbok",
      "raichu",
      "sandslash",
      "nidoking",
      "nidoqueen",
      "clefable",
      "ninetales",
      "wigglytuff",
      "vileplume",
      "poliwrath",
      "alakazam",
      "machamp",
      "golem",
      "slowbro",
      "gengar",
      "onix",
      "hypno",
      "kingler",
      "hitmonlee",
      "hitmonchan",
      "chansey",
      "tangela",
      "scyther",
      "jynx",
      "electabuzz",
      "magmar",
      "pinsir",
      "tauros",
      "gyarados",
      "lapras",
      "ditto",
      "eevee",
      "vaporeon",
      "jolteon",
      "flareon",
      "porygon",
      "omastar",
      "kabutops",
      "snorlax",
      "dragonite",
      "mewtwo",
      "mew",
      "porygon-z",
    ].map((name) => name.toLowerCase());

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
                            } (Nv. ${p.level}) ${
          isCurrentlyActive
            ? '<span class="text-[8px] text-green-600">(Ativo)</span>'
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
                          isCurrentlyActive
                            ? ""
                            : `window.GameLogic.setPokemonAsActive(${index})`
                        }"
                            class="gba-button text-xs w-1/4 h-12 ${
                              isCurrentlyActive
                                ? "bg-green-600 cursor-not-allowed"
                                : "bg-green-500 hover:bg-green-600"
                            }"
                            ${isCurrentlyActive ? "disabled" : ""}>
                            ${isCurrentlyActive ? "ATIVO" : "USAR"}
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

    const modalContent = `
            <div class="text-xl font-bold text-gray-800 gba-font mb-4 text-center flex-shrink-0">
                ${pokemon.name}
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
    const [pokemonData, speciesData] = await Promise.all([
      window.PokeAPI.fetchPokemonData(pokemonId, true),
      window.PokeAPI.fetchSpeciesData(pokemonId), // NOVO: Busca dados de espécie
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

  renderPokedex: function (app, filters = null) {
    // CORREÇÃO: Força filters a ser um objeto vazio se for null.
    filters = filters ?? {};

    const pokedexSet = window.gameState.profile.pokedex;
    const allTypes = [
      "grass",
      "fire",
      "water",
      "bug",
      "normal",
      "poison",
      "electric",
      "ground",
      "fairy",
      "fighting",
      "psychic",
      "rock",
      "ghost",
      "ice",
      "dragon",
      "steel",
      "dark",
      "flying",
    ];

    // Filtros atuais
    // Agora que filters é garantido ser um objeto, podemos acessar suas propriedades.
    const searchQuery = (filters.search || "").toLowerCase();
    const typeFilter = filters.type || "all";

    // Exporta a função de re-renderização com filtros para uso no HTML
    window.filterPokedex = (newSearch, newType) => {
      Renderer.showScreen("pokedex", {
        search: newSearch !== undefined ? newSearch : searchQuery,
        type: newType !== undefined ? newType : typeFilter,
      });
    };

    // Lógica de filtragem:
    // 1. Cria uma lista de Pokémons (1 a 151)
    let filteredPokedex = [];

    // NOVA CORREÇÃO: Inicializa pokedexCache se ainda não existir (caso de saves antigos)
    if (!window.gameState.pokedexCache) {
      window.gameState.pokedexCache = {};
    }

    // NOVO: Adiciona uma chamada para carregar os dados de Pokédex assincronamente
    // e redesenhar a tela quando concluído.
    Renderer._ensurePokedexCacheLoaded();

    for (let id = 1; id <= window.GameConfig.POKEDEX_LIMIT; id++) {
      // Verifica se o Pokémon está no cache (para obter o nome e tipos)
      const cachedData = window.gameState.pokedexCache[id];

      // CORREÇÃO 1: Pega o nome REAL do Pokémon no cache, se ele existir.
      // Se não houver nome no cache, assume que é o ID para fins de filtro de nome.
      const pokemonNameRaw = cachedData?.name
        ? cachedData.name.toLowerCase()
        : `poke-${id}`;
      const pokemonNameFormatted = window.Utils.formatName(pokemonNameRaw);

      // CORREÇÃO 2: A lógica de exibição do nome
      let displayName;
      let isKnown = pokedexSet.has(id);

      if (isKnown) {
        // Se o nome real estiver no cache, use-o
        displayName = cachedData?.name
          ? pokemonNameFormatted
          : `POKÉMON #${id.toString().padStart(3, "0")}`;
      } else {
        // Se não for capturado, mostra "???"
        displayName = `???`;
      }

      // CORREÇÃO 3 (Filtro de Tipo):
      // Só ignora se o tipo for diferente de 'all' E
      // o Pokémon está no cache (tem tipos definidos) E o tipo não corresponde.
      // Se o Pokémon não estiver no cache (e, portanto, não tem tipo definido) ele DEVE ser exibido,
      // a menos que o filtro não seja 'all'.

      const hasTypeMatch = cachedData?.types?.includes(typeFilter) ?? false;

      // A lógica do filtro:
      // Se o filtro for 'all', sempre mostra.
      // Se o filtro for por um tipo específico:
      //    - Se o Pokémon for conhecido (cache existe) E tiver o tipo: mostra.
      //    - Se o Pokémon NÃO for conhecido (cache não existe), ele não tem tipo, então não mostra.

      if (typeFilter !== "all") {
        // Se o Pokémon estiver na Pokédex (visto/capturado) mas não tem o tipo filtrado, ou
        // Se o Pokémon não foi visto e não tem o tipo filtrado,
        // E o tipo filtrado é diferente de 'all', então continue (pula).
        if (!hasTypeMatch) {
          continue;
        }
      }

      // Filtra por busca (nome ou ID)
      if (searchQuery) {
        const isMatchByName = pokemonNameRaw.includes(searchQuery);
        const isMatchById = id.toString().includes(searchQuery);

        // O nome do Pokémon (raw, em minúsculas) deve bater OU o ID deve bater
        if (!isMatchByName && !isMatchById) {
          continue;
        }
      }

      // Adiciona à lista filtrada
      filteredPokedex.push({ id: id, isCaught: isKnown, name: displayName });
    }

    const pokedexHtml = filteredPokedex
      .map((p) => {
        const id = p.id;
        const isCaught = p.isCaught;
        const displayId = id.toString().padStart(3, "0");

        const displayUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
        let displayName = p.name;
        let filterStyle = "filter: grayscale(100%) brightness(0.1);";

        // Se capturado, exibe o sprite colorido.
        if (isCaught) {
          filterStyle = "";
        }

        return `
            <div onclick="Renderer.showPokedexStats(${id}, ${!isCaught})" 
                 class="flex flex-col items-center p-1 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors duration-100 bg-white">
                <img src="${displayUrl}" alt="Pokemon #${id}" class="w-12 h-12 mb-1" style="${filterStyle}">
                
                <!-- Nome/ID (Placeholder para escala de grade) -->
                <div class="text-center w-full truncate">
                    <span class="gba-font text-[7px] font-bold ${
                      isCaught ? "text-gray-800" : "text-gray-400"
                    }">${displayName}</span>
                    <div class="text-[6px] gba-font text-gray-600 mt-1 truncate">
                       #${displayId}
                    </div>
                </div>
            </div>
        `;
      })
      .join("");

    const totalCaught = pokedexSet.size;
    const totalAvailable = window.GameConfig.POKEDEX_LIMIT;

    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">POKÉDEX</div>
            
            <!-- Contador de Registros -->
            <div class="text-center text-sm gba-font mb-4 flex-shrink-0">
                REGISTRADOS: ${totalCaught} / ${totalAvailable}
            </div>
            
            <!-- NOVO: Área de Busca e Filtro -->
            <div class="mb-4 flex flex-col sm:flex-row gap-2 flex-shrink-0">
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
            
            <!-- Grid de Pokémons (3 Colunas, responsivo) -->
            <div class="flex-grow overflow-y-auto border border-gray-400 p-0 mb-4 bg-gray-100 pokemon-list-container">
                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1 p-1">
                    ${
                      pokedexHtml ||
                      '<p class="text-center text-gray-500 gba-font p-4">Nenhum Pokémon encontrado com o filtro atual.</p>'
                    }
                </div>
            </div>
            <button onclick="Renderer.showScreen('pokemonMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    Renderer.renderGbaCard(content);
  },

  _ensurePokedexCacheLoaded: async function () {
    const totalAvailable = window.GameConfig.POKEDEX_LIMIT;
    const cache = window.gameState.pokedexCache;
    let cacheUpdated = false;

    // Se o cache já tiver sido preenchido para o limite total, saia.
    if (Object.keys(cache).length >= totalAvailable) {
      return;
    }

    // Cria um array de promessas para buscar todos os dados de Pokémons de 1 a 151
    const fetchPromises = [];
    for (let id = 1; id <= totalAvailable; id++) {
      // Se o Pokémon não estiver no cache, adicione uma promessa de busca
      if (!cache[id] && window.gameState.profile.pokedex.has(id)) {
        fetchPromises.push(
          window.PokeAPI.fetchPokemonData(id, true)
            .then((data) => {
              // Se a busca for bem-sucedida, o fetchPokemonData já deve ter preenchido o cache.
              if (data && data.id) {
                // Apenas para garantir que o cache seja preenchido com nome e tipos
                // (fetchPokemonData já faz isso, mas replicamos para clareza)
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

    // Se ainda faltar Pokémons não capturados para completar o cache, buscamos apenas os dados mais essenciais:
    if (Object.keys(cache).length < totalAvailable) {
      for (let id = 1; id <= totalAvailable; id++) {
        if (!cache[id]) {
          fetchPromises.push(
            // Usamos um endpoint mais simples, se existir, ou fazemos uma busca leve
            window.PokeAPI.fetchPokemonData(id, true)
              .then((data) => {
                if (data && data.id) {
                  cacheUpdated = true;
                }
              })
              .catch((e) => {
                // Ignoramos o erro se o Pokémon for desconhecido, apenas marcamos o ID no cache
                // para não tentar buscar novamente no futuro, mas sem nome/tipo.
                if (!cache[id]) {
                  cache[id] = { name: null, types: [] };
                  cacheUpdated = true;
                }
              })
          );
        }
      }
    }

    if (fetchPromises.length > 0) {
      await Promise.allSettled(fetchPromises);

      // Se o cache foi atualizado, redesenha a Pokédex
      if (cacheUpdated) {
        // Preserva o filtro de pesquisa atual
        const currentFilters = {
          search: document.getElementById("pokedexSearch")?.value,
          type: document.getElementById("pokedexFilterType")?.value,
        };
        window.Utils.saveGame(); // Salva o cache atualizado
        Renderer.showScreen("pokedex", currentFilters);
      }
    }
  },

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

  renderProfile: function (app) {
    const profile = window.gameState.profile;
    const trainerImage =
      profile.trainerGender === "MALE"
        ? "https://placehold.co/100x100/38bdf8/fff?text=TREINADOR"
        : "https://placehold.co/100x100/f87171/fff?text=TREINADORA";

    // Verifica se o usuário é anônimo para mostrar o botão de login
    const isAnonymous = window.userId.startsWith("anonymous-");

    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">PERFIL DO TREINADOR</div>
            <div class="flex flex-col items-center justify-center mb-4 flex-shrink-0">
                <img src="${trainerImage}" alt="Imagem do Treinador" class="w-20 h-20 rounded-full border-4 border-gray-800">
            </div>
            
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
                              profile.trainerGender === "FEMALE"
                                ? "checked"
                                : ""
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
            
            ${
              isAnonymous
                ? `
                <div class="mt-2 text-center text-xs gba-font text-gray-600">
                    Faça login para salvar na nuvem!
                </div>
                <div class="mt-1 flex-shrink-0">
                    <button
                        onclick="window.signInWithGoogle()"
                        class="gba-button bg-blue-500 hover:bg-blue-600 w-full flex items-center justify-center space-x-2"
                    >
                        <i class="fa-brands fa-google"></i>
                        <span>LOGIN COM GOOGLE</span>
                    </button>
                </div>
            `
                : ""
            }
            ${
              !isAnonymous
                ? `
    <div class="mt-2 flex-shrink-0">
        <button onclick="window.signOutUser()" class="gba-button bg-red-500 hover:bg-red-600 w-full">
            LOGOUT
        </button>
    </div>
`
                : ""
            }

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
            buyButton.classList.add("bg-gray-400");
            buyButton.classList.remove("bg-green-500", "hover:bg-green-600");
          } else {
            buyButton.disabled = false;
            buyButton.classList.remove("bg-gray-400");
            buyButton.classList.add("bg-green-500", "hover:bg-green-600");
          }
        }
      }
    }

    // Exporta a função para o escopo global para que os botões possam acessá-la
    window.updateSubtotal = updateSubtotal;

    const shopItemsHtml = GameConfig.SHOP_ITEMS.map((item) => {
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
                <span class="gba-font text-[10px] sm:text-xs text-gray-600 block sm:inline"> (P$${
                  item.cost
                } cada)</span>
                <!-- Subtotal dinâmico -->
                <div id="subtotal-${inputId}" class="gba-font text-xs text-yellow-700 font-bold mt-1">
                    Subtotal: P$${initialSubtotal}
                </div>
              </div>

              <!-- Quantity Input and Button Group -->
              <div class="flex items-center space-x-1 flex-shrink-0 w-full sm:w-auto">
                
                <!-- Botão Decrementar -->
                <button onclick="document.getElementById('${inputId}').value = Math.max(1, parseInt(document.getElementById('${inputId}').value) - 1); window.updateSubtotal('${inputId}', ${
        item.cost
      });"
                        class="w-8 h-8 gba-button bg-red-400 hover:bg-red-500 p-0 text-xl leading-none">-</button>
                
                <!-- Input de Quantidade -->
                <input id="${inputId}" type="number" value="1" min="1" max="99"
                    oninput="window.updateSubtotal('${inputId}', ${item.cost})"
                    class="w-16 p-1 border-2 border-gray-400 rounded gba-font text-sm text-center bg-white shadow-inner">
                
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
            <button onclick="Renderer.showScreen('serviceMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    Renderer.renderGbaCard(content);
  },

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
                            <div class="font-bold gba-font">${p.name} </div>
                            <div class="text-xs gba-font">
                            (Nv. ${p.level})
                            HP: ${p.currentHp}/${p.maxHp}</div>
                        </div>
                    </div>
                    <button 
                        onclick="${
                          canSelect
                            ? `window.BattleCore.switchPokemon(${index})`
                            : ""
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
  },
};
