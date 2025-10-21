// js/renderer_menus.js
if (typeof window.Renderer === 'undefined') {
  window.Renderer = {};
}

window.Renderer.copyPlayerId = function () {
  const playerId = window.userId;
  const copyIcon = document.getElementById("copyIdIcon");

  if (navigator.clipboard) {
    navigator.clipboard.writeText(playerId).then(() => {

      const originalHtml = copyIcon.dataset.originalHtml;

      copyIcon.innerHTML = `<i class="fa-solid fa-check"></i>`;
      copyIcon.classList.remove("text-blue-600", "hover:text-blue-800");
      copyIcon.classList.add("text-green-600");

      setTimeout(() => {
        copyIcon.innerHTML = originalHtml;
        copyIcon.classList.remove("text-green-600");
        copyIcon.classList.add("text-blue-600", "hover:text-blue-800");
      }, 1500);
    }).catch(err => {
      console.error('Falha ao copiar usando navigator.clipboard:', err);
      // Fallback para document.execCommand
      RendererMenus.fallbackCopy(playerId, copyIcon);
    });
  } else {
    // 2. Fallback
    RendererMenus.fallbackCopy(playerId, copyIcon);
  }
};

const fallbackCopy = function (text, iconElement) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');

    const originalHtml = iconElement.dataset.originalHtml;

    iconElement.innerHTML = `<i class="fa-solid fa-check"></i>`;
    iconElement.classList.remove("text-blue-600", "hover:text-blue-800");
    iconElement.classList.add("text-green-600");

    setTimeout(() => {
      iconElement.innerHTML = originalHtml;
      iconElement.classList.remove("text-green-600");
      iconElement.classList.add("text-blue-600", "hover:text-blue-800");
    }, 1500);
  } catch (err) {
    console.error('Falha ao copiar o ID: ', err);
    window.Utils.showModal("errorModal", "Falha ao copiar o ID. Por favor, copie manualmente.");
  }
  document.body.removeChild(textarea);
};

export const RendererMenus = {
  updateGenderOnly: function (gender) {
    window.gameState.profile.trainerGender = gender;
  },

  copyPlayerId: window.Renderer.copyPlayerId,
  fallbackCopy: fallbackCopy,

  // MUDAR O TITULO
  renderInitialMenu: function (app) {
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
    window.Renderer.renderGbaCard(content);
  },

  renderStarterSelection: function (app) {
    const trainerName = window.gameState.profile.trainerName;
    const currentGender = window.gameState.profile.trainerGender;

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
                            <div onclick="window.Renderer.selectGender('MALE')" 
                                class="flex flex-col items-center p-3 border-4 rounded-lg transition-all duration-200 cursor-pointer 
                                ${currentGender === "MALE"
        ? "border-blue-600 bg-blue-200 shadow-lg"
        : "border-gray-300 bg-white hover:bg-gray-200"
      }">
                                <img id="maleTrainerImage" src="https://i.redd.it/3mmmx0dz9nmb1.gif" 
                                    alt="Treinador Masculino" 
                                    class="h-24 object-contain" 
                                    onerror="this.src='https://placehold.co/150x150/38bdf8/fff?text=M'">
                                <div class="text-xs gba-font mt-1">Homem</div>
                            </div>
                            <div onclick="window.Renderer.selectGender('FEMALE')" 
                                class="flex flex-col items-center p-3 border-4 rounded-lg transition-all duration-200 cursor-pointer 
                                ${currentGender === "FEMALE"
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
                                <div onclick="window.selectStarter('${name}')" class="flex flex-col items-center flex-1 cursor-pointer">
                                    <img src="../assets/sprites/pokemon/${starterSpriteIds[name]
          }_front.png" alt="${name}" 
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
    window.Renderer.renderGbaCard(content);
  },

  selectGender: function (gender) {
    window.gameState.profile.trainerGender = gender;
    window.Renderer.renderStarterSelection(document.getElementById("app-container"));
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

        window.GameLogic.saveProfile({ redirectTo: "mainMenu" });
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
    const isBetaMode = profile.preferences?.isBetaMode || false;
    const exploreAction = isBetaMode ? `window.Renderer.showScreen('mapView')` : `window.GameLogic.explore()`;
    const exploreButtonText = isBetaMode ? "MAPA MUNDIAL (BETA)" : "ANDAR";
    const exploreButtonColor = isBetaMode ? "bg-orange-500 hover:bg-orange-600" : "bg-green-500 hover:bg-green-600";

    const allFainted =
      profile.pokemon.length > 0 &&
      profile.pokemon.every((p) => p.currentHp <= 0);

    const trainerImage =
      profile.trainerGender === "MALE"
        ? "https://placehold.co/100x100/38bdf8/fff?text=M"
        : "https://placehold.co/100x100/f87171/fff?text=F";

    const statsHtml = `
  <div class="p-4 bg-gray-900 border-4 border-yellow-400 rounded-xl shadow-2xl transition-all duration-300 hover:shadow-yellow-400/50 transform hover:scale-[1.01]">
      <div class="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          
          <div class="relative flex-shrink-0">
              <img src="${trainerImage}" alt="Treinador" 
                  class="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-yellow-400 object-cover shadow-lg hover:shadow-xl transition-shadow duration-300 animate-pulse-once">
              <span class="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></span>
          </div>
          
          <div class="flex-grow text-white text-center sm:text-left">
              <h2 class="text-3xl font-extrabold text-yellow-400 mb-2 tracking-wider uppercase">
                  ${profile.trainerName}
              </h2>
              <p class="text-sm text-gray-400 mb-4 border-b border-gray-700 pb-2">
                  O(A) lendário(a) treinador(a) de Kanto
              </p>
              
              <div class="grid grid-cols-2 gap-y-2 gap-x-4 text-sm md:text-base">
                  
                  <div class="flex items-center space-x-2">
                      <span class="text-yellow-400">
                          ${profile.trainerGender === "MALE" ? '♂️' : '♀️'}
                      </span>
                      <p>
                          <strong class="text-gray-300">GÊNERO:</strong> 
                          ${profile.trainerGender === "MALE" ? "MASCULINO" : "FEMININO"}
                      </p>
                  </div>
                  
                  <div class="flex items-center space-x-2">
                      <span class="text-green-500">💰</span>
                      <p>
                          <strong class="text-gray-300">DINHEIRO:</strong> 
                          P$${profile.money.toLocaleString('pt-BR')}
                      </p>
                  </div>
                  
                  <div class="flex items-center space-x-2">
                      <span class="text-red-500">🔴</span>
                      <p>
                          <strong class="text-gray-300">POKÉS:</strong> 
                          ${profile.pokemon.length} / 1025
                      </p>
                  </div>

                  <div class="flex items-center space-x-2">
                      <span class="text-blue-400">🏅</span>
                      <p>
                          <strong class="text-gray-300">INSÍGNIAS:</strong> 
                          8
                      </p>
                  </div>
              </div>
          </div>
      </div>
  </div>

  <style>
      /* Exemplo de keyframes para uma animação sutil */
      @keyframes pulse-once {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
      }
      .animate-pulse-once:hover {
          animation: pulse-once 0.5s ease-in-out;
      }
  </style>
          `;

    const menuHtml = `
            <div class="space-y-2 p-2 h-full flex flex-col justify-start">
                <button onclick="window.Renderer.showScreen('pokemonMenu')" class="gba-button bg-red-500 hover:bg-red-600">MEU TIME</button>
                <button onclick="window.Renderer.showScreen('serviceMenu')" class="gba-button bg-cyan-500 hover:bg-cyan-600">SERVIÇOS</button>
                <button onclick="window.Renderer.showScreen('pvpSetup')" class="gba-button bg-purple-500 hover:bg-purple-600">BATALHA PVP</button>
                <button onclick="window.Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600">PERFIL E OPÇÕES</button>
            </div>
        `;

    const exploreDisabled = allFainted && !isBetaMode ? "disabled" : "";

    const exploreLog = window.gameState.exploreLog || [];
    const exploreMsg = allFainted && !isBetaMode
      ? '<span class="text-red-500">TODOS DESMAIADOS! Vá para o Centro Pokémon.</span>'
      : exploreLog.length > 0
        ? exploreLog.slice(-1)[0]
        : "O que você fará?";

    const exploreHtml = `
            <div class="p-2 bg-white border-2 border-gray-800 rounded-lg shadow-inner flex-shrink-0">
                <div class="text-sm font-bold text-gray-800 gba-font border-b border-gray-300 pb-1 mb-2">EXPLORAÇÃO RÁPIDA</div>
                <div id="explore-result" class="h-16 text-xs gba-font mb-2 overflow-y-auto">
                    ${exploreMsg}
                </div>
                <button onclick="${exploreAction}" class="gba-button ${exploreButtonColor} w-full ${exploreDisabled}" ${exploreDisabled}>${exploreButtonText}</button>
            </div>
        `;

    const combinedHtml = `
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

    window.Renderer.renderGbaCard(combinedHtml);
  },

  renderProfileMenu: function (app) {
    const content = `
      <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">PERFIL E OPÇÕES</div>
    
      <div class="space-y-4 p-4 flex-grow overflow-y-auto">
        <button onclick="window.Renderer.showScreen('profile')" class="gba-button bg-blue-500 hover:bg-blue-600">PERFIL DO TREINADOR</button>
        <button onclick="window.PokeFriendship.showFriendListModal()" class="gba-button bg-orange-500 hover:bg-orange-600">AMIZADES</button>
        <button onclick="window.Renderer.showScreen('preferences')" class="gba-button bg-yellow-500 hover:bg-yellow-600">PREFERÊNCIAS</button>
      </div>
    
      <button onclick="window.Renderer.showScreen('mainMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
    `;
    window.Renderer.renderGbaCard(content);
  },

  renderFriendshipMenu: function (app) {
    // A chamada para showFriendListModal agora renderiza o modal diretamente (com o input para link)
    window.PokeFriendship.showFriendListModal();

    // Renderiza um placeholder na tela principal enquanto o modal é exibido
    const placeholder = `
      <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">AMIGOS</div>
      <div class="space-y-4 p-4 flex-grow overflow-y-auto flex items-center justify-center">
        <p class="gba-font text-xs text-gray-600">Carregando lista de amigos...</p>
      </div>
      <button onclick="window.Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
    `;
    window.Renderer.renderGbaCard(placeholder);
  },

  renderPokemonMenu: function (app) {
    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">MEU TIME</div>
            
            <div class="space-y-4 p-4 flex-grow overflow-y-auto">
                <button onclick="window.Renderer.showScreen('pokemonList')" class="gba-button bg-red-500 hover:bg-red-600">VER POKÉMONS</button>
                <button onclick="window.Renderer.showScreen('bag')" class="gba-button bg-yellow-500 hover:bg-yellow-600">MOCHILA</button>
                <button onclick="window.Renderer.showScreen('pokedex')" class="gba-button bg-orange-500 hover:bg-orange-600">POKÉDEX</button>
            </div>
            
            <button onclick="window.Renderer.showScreen('mainMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    window.Renderer.renderGbaCard(content);
  },

  renderServiceMenu: function (app) {
    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">SERVIÇOS</div>
            
            <div class="space-y-4 p-4 flex-grow overflow-y-auto">
                <button onclick="window.Renderer.showScreen('healCenter')" class="gba-button bg-pink-500 hover:bg-pink-600">CENTRO POKÉMON</button>
                <button onclick="window.Renderer.showScreen('shop')" class="gba-button bg-cyan-500 hover:bg-cyan-600">LOJA</button> 
            </div>
            
            <button onclick="window.Renderer.showScreen('mainMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
        `;
    window.Renderer.renderGbaCard(content);
  },

  renderPreferences: function (app) {
    const prefs = window.gameState.profile.preferences;
    const volumePercent = Math.round(prefs.volume * 100);
    const isMuted = prefs.isMuted;
    const isBetaMode = prefs.isBetaMode;

    const content = `
          <div class="text-xl font-bold text-center mb-6 text-gray-800 gba-font flex-shrink-0">PREFERÊNCIAS</div>
          
          <div class="p-4 bg-white border-2 border-gray-800 rounded-lg shadow-inner mb-6 flex-grow overflow-y-auto">
              
              <div class="text-sm font-bold text-gray-800 gba-font mb-4 border-b border-gray-300 pb-2 flex justify-between items-center">
                  <span>MODO BETA</span>
                  <button onclick="window.Utils.toggleBetaMode()" 
                          class="gba-button w-24 h-8 text-[10px] ${isBetaMode
        ? "bg-red-500 hover:bg-red-600"
        : "bg-green-500 hover:bg-green-600"
      }">
                      ${isBetaMode ? "DESATIVAR" : "ATIVAR"}
                  </button>
              </div>
              <p class="text-xs gba-font text-gray-500 mb-6">
                ${isBetaMode
        ? 'Ativado. A tela "Explorar" agora é o Mapa Mundial (WIP).'
        : 'Desativado. A navegação será por texto e botões.'
      }
              </p>

              <div class="text-sm font-bold text-gray-800 gba-font mb-4 border-b border-gray-300 pb-2">CONTROLE DE SOM</div>
              
              <div class="mb-6">
                  <label for="volumeSlider" class="block text-xs font-bold gba-font mb-2">
                      Volume da Música: ${volumePercent}%
                  </label>
                  <input type="range" id="volumeSlider" min="0" max="1" step="0.01" value="${prefs.volume
      }" 
                         oninput="window.updateVolume(this.value)"
                         class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg">
              </div>

              <button onclick="window.toggleMute()" 
                      class="gba-button w-full ${isMuted
        ? "bg-red-500 hover:bg-red-600"
        : "bg-green-500 hover:bg-green-600"
      }">
                  ${isMuted
        ? "SOM MUDO (CLIQUE PARA LIGAR)"
        : "SOM LIGADO (CLIQUE PARA MUTAR)"
      }
              </button>
              <p class="text-xs gba-font text-gray-500 mt-2 text-center">(O volume atual do jogo é ${isMuted ? "MUDO" : "LIGADO"
      })</p>

          </div>
          
          <button onclick="window.Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
      `;
    window.Renderer.renderGbaCard(content);
  },

  renderProfile: function (app) {
    const profile = window.gameState.profile;
    const trainerImage =
      profile.trainerGender === "MALE"
        ? "https://placehold.co/100x100/38bdf8/fff?text=TREINADOR"
        : "https://placehold.co/100x100/f87171/fff?text=TREINADORA";

    const isAnonymous = window.userId.startsWith("anonimo");

    const content = `
            <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">PERFIL DO TREINADOR</div>
            <div class="flex flex-col items-center justify-center mb-4 flex-shrink-0">
                <img src="${trainerImage}" alt="Imagem do Treinador" class="w-20 h-20 rounded-full border-4 border-gray-800">
            </div>
            
            <div class="space-y-3 text-sm gba-font flex-grow  p-2">
                <div>
                    <label for="newTrainerName" class="block text-xs font-bold mb-1">Nome:</label>
                    <input id="newTrainerName" type="text" value="${profile.trainerName
      }"
                        class="w-full p-2 border-2 border-gray-800 rounded gba-font text-sm text-center bg-white shadow-inner uppercase">
                </div>
                <div>
                    <p class="text-xs font-bold mb-1">Gênero:</p>
                    <div class="flex justify-center space-x-4 text-xs">
                        <label class="flex items-center space-x-1">
                            <input type="radio" name="newTrainerGender" value="MALE" ${profile.trainerGender === "MALE" ? "checked" : ""
      } onclick="window.Renderer.updateGenderOnly('MALE')">
                            <span>Homem</span>
                        </label>
                        <label class="flex items-center space-x-1">
                            <input type="radio" name="newTrainerGender" value="FEMALE" ${profile.trainerGender === "FEMALE"
        ? "checked"
        : ""
      } onclick="window.Renderer.updateGenderOnly('FEMALE')">
                            <span>Mulher</span>
                        </label>
                    </div>
                </div>
                <p><strong>Dinheiro:</strong> P$${profile.money}</p>
                <p><strong>Pokémons:</strong> ${profile.pokemon.length}</p>
                
                <div class="mb-4">
                  <p class="text-xs font-bold mb-1">ID de Jogador (Para Amigos):</p>
                  <div class="flex items-center space-x-1 border-2 border-gray-800 rounded bg-white shadow-inner px-2 py-1">
                      <p style="font-size:7px;" class="gba-font truncate flex-grow text-gray-400 text-center select-all">${window.userId}</p>
                      
                      <span 
                          id="copyIdIcon"
                          onclick="window.Renderer.copyPlayerId()" 
                          data-original-html='<i class="fa-solid fa-copy"></i>'
                          class="cursor-pointer text-lg text-blue-600 hover:text-blue-800 transition-colors duration-150 flex-shrink-0"
                          title="Copiar ID do Jogador"
                      >
                          <i class="fa-solid fa-copy"></i>
                      </span>
                  </div>
                </div>
            </div>
            
            <div class="mt-4 flex-shrink-0">
                <button onclick="window.GameLogic.saveProfile()" class="gba-button bg-green-500 hover:bg-green-600 w-full mb-2">Salvar Perfil</button>
            </div>
            
            ${isAnonymous
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
            ${!isAnonymous
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
            
            <button onclick="window.Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full mt-4 flex-shrink-0">Voltar</button>
        `;
    window.Renderer.renderGbaCard(content);
  },
};