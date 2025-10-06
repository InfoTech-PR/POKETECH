// renderer_menus.js
// Renderização das telas de menu principal, perfil e preferências.

// Garante que o objeto window.Renderer exista para anexar a função auxiliar.
// Em um sistema modular, isso é um "hack" para o HTML/onclick funcionar diretamente.
if (typeof window.Renderer === 'undefined') {
    window.Renderer = {};
}

/**
 * NOVO: Função para copiar o ID do jogador para a área de transferência.
 * Exposta diretamente para o HTML/onclick funcionar corretamente.
 */
window.Renderer.copyPlayerId = function () {
    const playerId = window.userId;
    const copyIcon = document.getElementById("copyIdIcon"); 

    // 1. Tenta usar a API moderna (navigator.clipboard)
    if (navigator.clipboard) {
      navigator.clipboard.writeText(playerId).then(() => {
        // Salva o HTML original para restaurar depois
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

// A função fallbackCopy ainda pode ficar interna a RendererMenus
const fallbackCopy = function(text, iconElement) { 
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
  // NOVO: Função para atualizar APENAS o gênero no estado.
  updateGenderOnly: function (gender) {
    window.gameState.profile.trainerGender = gender;
  },
  
  // Agora apenas referencia a função global para uso interno (embora no seu caso só o HTML use)
  copyPlayerId: window.Renderer.copyPlayerId, 
  fallbackCopy: fallbackCopy, // Define fallbackCopy dentro do objeto RendererMenus

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
                            <div onclick="window.Renderer.selectGender('FEMALE')" 
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
                                <div onclick="window.selectStarter('${name}')" class="flex flex-col items-center flex-1 cursor-pointer">
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
    window.Renderer.renderGbaCard(content);
  },

  /**
   * Função usada SOMENTE na seleção inicial para atualizar o estado E redesenhar a tela
   * para mostrar a seleção visual.
   */
  selectGender: function (gender) {
    window.gameState.profile.trainerGender = gender;
    // Redesenha para atualizar a seleção visualmente
    window.Renderer.renderStarterSelection(document.getElementById("app-container"));
  },
  
  // Função auxiliar para `renderStarterSelection`
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
                <button onclick="window.Renderer.showScreen('pokemonMenu')" class="gba-button bg-red-500 hover:bg-red-600">MEU TIME</button>
                <button onclick="window.Renderer.showScreen('serviceMenu')" class="gba-button bg-cyan-500 hover:bg-cyan-600">SERVIÇOS</button>
                <button onclick="window.Renderer.showScreen('pvpSetup')" class="gba-button bg-purple-500 hover:bg-purple-600">BATALHA PVP</button>
                <button onclick="window.Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600">PERFIL E OPÇÕES</button>
                <!-- NOVO: Botão de Updates no Menu Principal -->
                <button onclick="window.Renderer.showScreen('updates')" class="gba-button bg-yellow-500 hover:bg-yellow-600">UPDATES</button>
            </div>
        `;

    const exploreDisabled = allFainted ? "disabled" : "";

    const exploreLog = window.gameState.exploreLog || [];
    const exploreMsg = allFainted
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

    window.Renderer.renderGbaCard(combinedHtml);
  },

  renderProfileMenu: function (app) {
    const content = `
      <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">PERFIL E OPÇÕES</div>
    
      <div class="space-y-4 p-4 flex-grow overflow-y-auto">
      <button onclick="window.Renderer.showScreen('profile')" class="gba-button bg-blue-500 hover:bg-blue-600">PERFIL DO TREINADOR</button>
      <button onclick="window.Renderer.showScreen('friendshipMenu')" class="gba-button bg-orange-500 hover:bg-orange-600">AMIZADES</button>
      <button onclick="window.Renderer.showScreen('preferences')" class="gba-button bg-yellow-500 hover:bg-yellow-600">PREFERÊNCIAS</button>
      </div>
    
      <button onclick="window.Renderer.showScreen('mainMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
    `;
    window.Renderer.renderGbaCard(content);
  },
  
  // NOVO: Renderiza a tela de updates
  renderUpdates: async function (app) {
      
      let updatesData = { updates: [], todos: [] };
      let errorMessage = null;

      try {
          // Obtém o cacheBuster atual (do app.js que está no escopo global)
          const cacheBuster = typeof window.cacheBuster !== 'undefined' ? window.cacheBuster : Date.now();
          const v = `?v=${cacheBuster}`;
          
          // Tenta carregar o arquivo JSON
          const response = await fetch(`./game_updates.json${v}`);

          if (!response.ok) {
              throw new Error(`Falha ao carregar game_updates.json: ${response.status}`);
          }

          updatesData = await response.json();
      } catch (e) {
          console.error("Erro ao carregar dados de updates:", e);
          errorMessage = "Falha ao carregar updates. Arquivo JSON ausente ou com erro.";
      }

      const updatesHtml = updatesData.updates.map(u => `
          <li class="mb-2 p-2 bg-gray-100 rounded border border-gray-300">
              <span class="text-[8px] gba-font text-gray-500 block">${u.date}</span>
              <span class="text-xs gba-font text-green-700">${u.text}</span>
          </li>
      `).join('');

      const todosHtml = updatesData.todos.map(t => `
          <li class="mb-1 text-xs gba-font text-red-700 list-disc ml-4">${t}</li>
      `).join('');

      const content = `
          <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">UPDATES DO JOGO</div>
          
          <div class="flex-grow overflow-y-auto p-2">
              ${errorMessage ? 
                `<p class="text-center text-red-600 gba-font text-sm">${errorMessage}</p>` :
                `
                <div class="mb-6">
                    <h3 class="font-bold gba-font text-sm mb-2 border-b border-gray-400 pb-1">HISTÓRICO DE MUDANÇAS</h3>
                    <ul class="space-y-2 text-left">
                        ${updatesHtml || '<li class="text-xs gba-font text-gray-500">Nenhum histórico disponível.</li>'}
                    </ul>
                </div>
                
                <div>
                    <h3 class="font-bold gba-font text-sm mb-2 border-b border-gray-400 pb-1 text-red-800">PRÓXIMAS TAREFAS (${updatesData.todos.length})</h3>
                    <ul class="space-y-1 text-left">
                        ${todosHtml || '<li class="text-xs gba-font text-gray-500">Nenhuma tarefa pendente.</li>'}
                    </ul>
                </div>
                `
              }
          </div>
          
          <button onclick="window.Renderer.showScreen('mainMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full mt-4 flex-shrink-0">Voltar</button>
      `;
    window.Renderer.renderGbaCard(content);
  },

  renderFriendshipMenu: function (app) {
    const content = `
    <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">AMIGOS</div>
    
    <div class="space-y-4 p-4 flex-grow overflow-y-auto">
      <button onclick="window.showFriendListModal()" class="gba-button bg-blue-500 hover:bg-blue-600">LISTA DE AMIGOS</button>
      <input id="friendIdInput" type="text" placeholder="ID do Amigo para Enviar" class="w-full p-2 border-2 border-gray-800 rounded gba-font text-sm text-center bg-white shadow-inner">
      <button onclick="window.sendFriendRequest(document.getElementById('friendIdInput').value)" class="gba-button bg-green-500 hover:bg-green-600">ENVIAR PEDIDO</button>
    </div>
    
    <button onclick="window.Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
    `;
    window.Renderer.renderGbaCard(content);
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
                         oninput="window.updateVolume(this.value)"
                         class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg">
              </div>

              <!-- Botão Mute -->
              <button onclick="window.toggleMute()" 
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

    const isAnonymous = window.userId.startsWith("anonimo"); // Correção de verificação

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
                            } onclick="window.Renderer.updateGenderOnly('MALE')">
                            <span>Homem</span>
                        </label>
                        <label class="flex items-center space-x-1">
                            <input type="radio" name="newTrainerGender" value="FEMALE" ${
                              profile.trainerGender === "FEMALE"
                                ? "checked"
                                : ""
                            } onclick="window.Renderer.updateGenderOnly('FEMALE')">
                            <span>Mulher</span>
                        </label>
                    </div>
                </div>
                <p><strong>Dinheiro:</strong> P$${profile.money}</p>
                <p><strong>Pokémons:</strong> ${profile.pokemon.length}</p>
                
                <!-- ID de Jogador com Ícone de cópia discreto e funcional -->
                <div class="mb-4">
                  <p class="text-xs font-bold mb-1">ID de Jogador (Para Amigos):</p>
                  <div class="flex items-center space-x-1 border-2 border-gray-800 rounded bg-white shadow-inner px-2 py-1">
                      <!-- O ID agora ocupa a maior parte do espaço e tem melhor legibilidade -->
                      <p style="font-size:7px;" class="gba-font truncate flex-grow text-gray-400 text-center select-all">${window.userId}</p>
                      
                      <!-- Ícone de cópia discreto e clicável -->
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
            
            <button onclick="window.Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full mt-4 flex-shrink-0">Voltar</button>
        `;
    window.Renderer.renderGbaCard(content);
  },
};
