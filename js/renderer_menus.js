// js/renderer_menus.js
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

if (typeof window.Renderer === 'undefined') {
  window.Renderer = {};
}

const TRAINER_AVATAR_CHOICES = [
  { key: "default", label: "Avatar 1", url: "https://pbs.twimg.com/profile_images/1896626291606011904/IcRwMWBB.jpg" },
  { key: "alt1", label: "Avatar 2", url: "https://static.wikia.nocookie.net/pokepediabr/images/c/cd/182Bellossom.png/revision/latest?cb=20171211223455&path-prefix=pt-br" },
  { key: "alt2", label: "Avatar 3", url: "https://pm1.aminoapps.com/6761/d63cf8f1a27519a70c9e5b86c45a5b2bb1fe8f85v2_hq.jpg" },
  { key: "alt3", label: "Avatar 4", url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlWjHugl5ST10ChrNyv8VHfuFmVjZnTIATdg&s" },
  { key: "alt4", label: "Avatar 5", url: "https://i.redd.it/pokemon-scarlet-e-violet-na-copa-feito-por-mim-mesma-v0-sxwmn2n88k0a1.jpg?width=2814&format=pjpg&auto=webp&s=93cf4267551095bb519b3a9505ce29b7b93c83ee" },
  { key: "alt5", label: "Avatar 6", url: "https://i.redd.it/c8z5m7o3osk81.jpg" },
  { key: "alt6", label: "Avatar 7", url: "https://wallpapers-clan.com/wp-content/uploads/2023/11/pokemon-gengar-spooky-smile-black-background-scaled.jpg" },
  { key: "alt7", label: "Avatar 8", url: "https://oyster.ignimgs.com/wordpress/stg.ign.com/2012/10/SQUIRTLE.jpg" },
];

const getTrainerAvatarUrl = (profile) => {
  if (!profile) return TRAINER_AVATAR_CHOICES[0].url;
  const prefs = profile.preferences || {};
  const selectedKey = prefs.avatarTrainerKey || TRAINER_AVATAR_CHOICES[0].key;
  return (
    TRAINER_AVATAR_CHOICES.find((choice) => choice.key === selectedKey)?.url ||
    TRAINER_AVATAR_CHOICES[0].url
  );
};

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

    const trainerImage = getTrainerAvatarUrl(profile);

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
            <div class="p-2">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                        onclick="window.Renderer.showScreen('pokemonMenu')"
                        class="gba-button bg-red-500 hover:bg-red-600 h-full flex items-center justify-center gap-3 py-4"
                    >
                        <span class="text-2xl sm:text-3xl">
                            <i class="fa-solid fa-people-group"></i>
                        </span>
                        <span class="flex flex-col text-left">
                            <span class="text-sm font-bold leading-none">MEU TIME</span>
                            <span class="text-xs opacity-80 leading-tight hidden sm:block">Gerencie seus Pokémon</span>
                        </span>
                    </button>
                    <button
                        onclick="window.Renderer.showScreen('serviceMenu')"
                        class="gba-button bg-cyan-500 hover:bg-cyan-600 h-full flex items-center justify-center gap-3 py-4"
                    >
                        <span class="text-2xl sm:text-3xl">
                            <i class="fa-solid fa-shop"></i>
                        </span>
                        <span class="flex flex-col text-left">
                            <span class="text-sm font-bold leading-none">SERVIÇOS</span>
                            <span class="text-xs opacity-80 leading-tight hidden sm:block">Centro Pokémon e Loja</span>
                        </span>
                    </button>
                    <button
                        onclick="window.Renderer.showScreen('pvpSetup')"
                        class="gba-button bg-purple-500 hover:bg-purple-600 h-full flex items-center justify-center gap-3 py-4"
                    >
                        <span class="text-2xl sm:text-3xl">
                            <i class="fa-solid fa-shield-halved"></i>
                        </span>
                        <span class="flex flex-col text-left">
                            <span class="text-sm font-bold leading-none">BATALHA PVP</span>
                            <span class="text-xs opacity-80 leading-tight hidden sm:block">Duele com outros treinadores</span>
                        </span>
                    </button>
                    <button
                        onclick="window.Renderer.showScreen('profileMenu')"
                        class="gba-button bg-gray-500 hover:bg-gray-600 h-full flex items-center justify-center gap-3 py-4"
                    >
                        <span class="text-2xl sm:text-3xl">
                            <i class="fa-solid fa-user-gear"></i>
                        </span>
                        <span class="flex flex-col text-left">
                            <span class="text-sm font-bold leading-none">PERFIL E OPÇÕES</span>
                            <span class="text-xs opacity-80 leading-tight hidden sm:block">Configurações e preferências</span>
                        </span>
                    </button>
                </div>
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
        <button onclick="window.Renderer.showScreen('friendshipMenu')" class="gba-button bg-orange-500 hover:bg-orange-600">AMIZADES & PVP</button>
        <button onclick="window.Renderer.showScreen('preferences')" class="gba-button bg-yellow-500 hover:bg-yellow-600">PREFERÊNCIAS</button>
      </div>
    
      <button onclick="window.Renderer.showScreen('mainMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0">Voltar</button>
    `;
    window.Renderer.renderGbaCard(content);
  },

  renderFriendshipMenu: async function (app) {
    const loadingView = `
      <div class="gba-card-wrapper text-white">
        <div class="flex flex-col h-full items-center justify-center space-y-4">
          <i class="fa-solid fa-spinner fa-spin text-3xl text-emerald-300"></i>
          <p class="gba-font text-xs tracking-widest text-emerald-200">CARREGANDO AMIZADES...</p>
        </div>
      </div>
    `;
    window.Renderer.renderGbaCard(loadingView);

    if (!window.db || !window.userId || window.userId === "anonimo" || window.userId === "anonimo-erro") {
      const requireLoginView = `
        <div class="gba-card-wrapper text-white">
          <div class="flex flex-col h-full justify-center items-center gap-4 text-center">
            <i class="fa-solid fa-lock text-4xl text-rose-300"></i>
            <div>
              <p class="gba-font text-sm text-rose-200 mb-3">RECURSO RESTRITO</p>
              <p class="text-xs text-gray-200 leading-relaxed">
                Faça login para sincronizar amizades, compartilhar links e batalhar em tempo real.
              </p>
      </div>
            <button onclick="window.Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-auto px-6">
              VOLTAR
            </button>
          </div>
        </div>
      `;
      window.Renderer.renderGbaCard(requireLoginView);
      return;
    }

    let friendships = [];
    try {
      friendships = await window.PokeFriendship.listFriendships();
    } catch (error) {
      console.error("Erro ao carregar amizades:", error);
      const errorView = `
        <div class="gba-card-wrapper text-white">
          <div class="flex flex-col h-full justify-center items-center gap-4 text-center">
            <i class="fa-solid fa-triangle-exclamation text-4xl text-amber-300"></i>
            <div>
              <p class="gba-font text-sm text-amber-200 mb-3">FALHA AO CARREGAR</p>
              <p class="text-xs text-gray-200 leading-relaxed">
                Não foi possível conversar com o Firestore. Verifique sua conexão ou tente novamente.
              </p>
            </div>
            <button onclick="window.Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-auto px-6">
              VOLTAR
            </button>
          </div>
        </div>
      `;
      window.Renderer.renderGbaCard(errorView);
      return;
    }

    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const escapeAttr = (value) =>
      String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"');

    const formatDate = (timestamp) => {
      if (!timestamp) return "";
      const dateObj =
        typeof timestamp.toDate === "function" ? timestamp.toDate() : timestamp;
      if (!(dateObj instanceof Date)) return "";
      return dateObj.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    const enriched = await Promise.all(
      friendships.map(async (f) => {
        const friendId = f.participants.find((id) => id !== window.userId);
        let friendName = friendId;
        try {
          const docRef = doc(window.db, "users", friendId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            friendName = data.trainerName || friendId;
          }
        } catch (error) {
          console.warn("Falha ao buscar dados do amigo:", error);
        }

        return {
          id: f.id,
          friendId,
          friendName,
          status: f.status,
          isRequester: f.requester === window.userId,
          createdAt: f.createdAt,
          acceptedAt: f.acceptedAt,
          since: formatDate(f.acceptedAt || f.createdAt),
        };
      })
    );

    const accepted = enriched
      .filter((f) => f.status === "accepted")
      .sort((a, b) => a.friendName.localeCompare(b.friendName, "pt-BR"));
    const incoming = enriched.filter((f) => f.status === "pending" && !f.isRequester);
    const outgoing = enriched.filter((f) => f.status === "pending" && f.isRequester);

    const buildFriendCard = (friend) => {
      const safeName = escapeHtml(friend.friendName);
      const attrName = escapeAttr(friend.friendName);
      const sinceText = friend.since
        ? `<span class="text-[10px] uppercase tracking-widest text-emerald-200">Desde ${friend.since}</span>`
        : `<span class="text-[10px] uppercase tracking-widest text-emerald-200">Amigo confirmado</span>`;

      return `
        <div class="bg-slate-800/80 border border-emerald-400/60 rounded-xl p-4 shadow-inner hover:shadow-emerald-400/40 transition-shadow duration-200 flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-xl shadow-lg">
              <i class="fa-solid fa-user-astronaut text-gray-900"></i>
            </div>
            <div>
              <div class="gba-font text-xs text-emerald-100">${safeName}</div>
              ${sinceText}
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button onclick="window.MapCore.openFriendInteraction('${friend.friendId}', '${attrName}')" class="gba-button bg-blue-500 hover:bg-blue-600" style="width:auto;">
              Interagir
            </button>
            <button onclick="window.Renderer.challengeFriendToPvp('${friend.friendId}', '${attrName}')" class="gba-button bg-purple-500 hover:bg-purple-600" style="width:auto;">
              Desafiar PvP
            </button>
            <button onclick="window.PokeFriendship.removeFriendship('${friend.id}')" class="gba-button bg-red-500 hover:bg-red-600" style="width:auto;">
              Remover
            </button>
          </div>
        </div>
      `;
    };

    const buildRequestCard = (friend, isIncoming) => {
      const safeName = escapeHtml(friend.friendName);
      const attrName = escapeAttr(friend.friendName);
      const sentOn = friend.since
        ? `<span class="text-[10px] uppercase tracking-widest text-amber-200">Enviado em ${friend.since}</span>`
        : "";
      const baseActions = isIncoming
        ? `
            <button onclick="window.PokeFriendship.acceptFriendRequest('${friend.id}')" class="gba-button bg-green-500 hover:bg-green-600" style="width:auto;">
              Aceitar
            </button>
            <button onclick="window.PokeFriendship.removeFriendship('${friend.id}')" class="gba-button bg-red-500 hover:bg-red-600" style="width:auto;">
              Recusar
            </button>
          `
        : `
            <button onclick="window.PokeFriendship.resendLinkModal('${friend.id}', '${friend.friendId}')" class="gba-button bg-blue-500 hover:bg-blue-600" style="width:auto;">
              Compartilhar Link
            </button>
            <button onclick="window.PokeFriendship.removeFriendship('${friend.id}')" class="gba-button bg-red-500 hover:bg-red-600" style="width:auto;">
              Cancelar
            </button>
          `;

      return `
        <div class="bg-slate-800/80 border border-amber-400/60 rounded-xl p-4 shadow-inner flex flex-col gap-3">
          <div>
            <div class="gba-font text-xs text-amber-100">${safeName}</div>
            ${sentOn}
          </div>
          <div class="flex flex-wrap gap-2">
            ${baseActions}
          </div>
        </div>
      `;
    };

    const emptyMessage = (icon, message) => `
      <div class="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gray-300 bg-slate-800/60 border border-dashed border-gray-400 rounded-lg px-3 py-3">
        <i class="fa-solid ${icon} text-lg text-gray-400"></i>
        <span>${message}</span>
      </div>
    `;

    const acceptedSection = `
      <div class="bg-slate-900/90 border-4 border-emerald-400 rounded-2xl p-4 shadow-2xl">
        <div class="flex items-center gap-2 mb-3">
          <i class="fa-solid fa-handshake-simple text-xl text-emerald-300"></i>
          <h2 class="gba-font text-sm text-emerald-200 tracking-widest">AMIGOS DISPONÍVEIS (${accepted.length})</h2>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          ${accepted.length > 0
        ? accepted.map(buildFriendCard).join("")
        : emptyMessage("fa-sparkles", "SEM AMIGOS CONFIRMADOS AINDA. ENVIE UM PEDIDO!")
      }
        </div>
      </div>
    `;

    const pendingSection = `
      <div class="bg-slate-900/90 border-4 border-amber-400 rounded-2xl p-4 shadow-2xl">
        <div class="flex items-center gap-2 mb-3">
          <i class="fa-solid fa-envelope-circle-check text-xl text-amber-300"></i>
          <h2 class="gba-font text-sm text-amber-200 tracking-widest">SOLICITAÇÕES PENDENTES</h2>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <div class="bg-slate-800/70 rounded-xl p-3 flex flex-col gap-2 border border-amber-400/40">
            <div class="flex items-center gap-2 text-xs text-amber-100 uppercase tracking-widest">
              <i class="fa-solid fa-inbox text-amber-200"></i> Recebidas (${incoming.length})
            </div>
            ${incoming.length > 0
        ? incoming.map((f) => buildRequestCard(f, true)).join("")
        : emptyMessage("fa-hand-holding-heart", "NENHUM PEDIDO RECEBIDO NO MOMENTO.")
      }
          </div>
          <div class="bg-slate-800/70 rounded-xl p-3 flex flex-col gap-2 border border-amber-400/40">
            <div class="flex items-center gap-2 text-xs text-amber-100 uppercase tracking-widest">
              <i class="fa-solid fa-paper-plane text-amber-200"></i> Enviadas (${outgoing.length})
            </div>
            ${outgoing.length > 0
        ? outgoing.map((f) => buildRequestCard(f, false)).join("")
        : emptyMessage("fa-paper-plane", "VOCÊ NÃO ENVIOU NENHUM CONVITE AINDA.")
      }
          </div>
        </div>
      </div>
    `;

    const friendCodeCard = `
      <div class="bg-gradient-to-r from-rose-600 via-purple-600 to-sky-500 border-4 border-white/40 rounded-3xl p-5 shadow-2xl">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 class="gba-font text-lg md:text-xl text-white tracking-widest">CLUBE DE AMIGOS</h1>
            <p class="text-xs text-white/80 uppercase tracking-widest">
              Use seu ID para conectar treinadores e liberar recursos PvP.
            </p>
          </div>
          <div class="bg-black/40 border border-white/40 rounded-xl px-4 py-3 text-center shadow-lg">
            <div class="text-[10px] text-white/70 uppercase tracking-widest mb-1">Seu ID de treinador</div>
            <div class="gba-font text-sm text-white tracking-widest break-all">${escapeHtml(window.userId)}</div>
            <button onclick="window.Renderer.copyTrainerIdFromCard()" class="gba-button bg-white text-gray-900 hover:bg-gray-200 mt-3" style="width:auto;">
              Copiar ID
            </button>
            <div id="friendship-copy-feedback" class="mt-2 text-[10px] text-emerald-100 uppercase tracking-widest"></div>
          </div>
        </div>
      </div>
    `;

    const inviteCard = `
      <div class="bg-slate-900/90 border-4 border-purple-400 rounded-2xl p-4 shadow-2xl">
        <div class="flex items-center gap-2 mb-3">
          <i class="fa-solid fa-user-plus text-xl text-purple-300"></i>
          <h2 class="gba-font text-sm text-purple-200 tracking-widest">GERAR CONVITE DE AMIZADE</h2>
        </div>
        <p class="text-xs text-gray-300 mb-3">
          Peça para o seu amigo informar o ID de treinador. Geraremos um link mágico para ele aceitar.
        </p>
        <div class="flex flex-col sm:flex-row gap-2">
          <input id="friend-id-input" type="text" placeholder="ID do amigo" class="flex-1 p-2 border-2 border-purple-400 rounded gba-font text-xs text-center bg-slate-800 text-purple-100 shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-300">
          <button onclick="window.Renderer.handleFriendLinkGeneration()" class="gba-button bg-purple-500 hover:bg-purple-600 sm:w-auto px-4">
            Gerar Link
          </button>
        </div>
        <div id="friendship-link-feedback" class="mt-3 text-xs text-purple-100"></div>
      </div>
    `;

    const pvpCard = `
      <div class="bg-slate-900/90 border-4 border-blue-400 rounded-2xl p-4 shadow-2xl">
        <div class="flex items-center gap-2 mb-3">
          <i class="fa-solid fa-bolt text-xl text-blue-300"></i>
          <h2 class="gba-font text-sm text-blue-200 tracking-widest">CENTRO DE BATALHAS PVP</h2>
        </div>
        <p class="text-xs text-gray-300 mb-3">
          Crie uma sala para desafiar seus amigos ou entre em uma sala existente usando um código.
        </p>
        <div class="flex flex-col gap-3">
          <button onclick="window.Renderer.challengeFriendToPvp('', '')" class="gba-button bg-blue-500 hover:bg-blue-600 w-full sm:w-auto px-6" style="width:auto;">
            Criar Sala PvP
          </button>
          <div class="flex flex-col sm:flex-row gap-2">
            <input id="pvp-room-input" type="text" placeholder="Código da sala (ex: ABC123)" class="flex-1 p-2 border-2 border-blue-400 rounded gba-font text-xs text-center bg-slate-800 text-blue-100 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-300">
            <button onclick="window.Renderer.joinPvpFromFriendship()" class="gba-button bg-cyan-500 hover:bg-cyan-600 sm:w-auto px-4">
              Entrar na Sala
            </button>
          </div>
        </div>
        <div id="friendship-pvp-feedback" class="mt-3 text-xs text-blue-100"></div>
      </div>
    `;

    const content = `
      <div class="gba-card-wrapper text-white">
        <div class="flex flex-col h-full gap-4">
          ${friendCodeCard}
          <div class="flex flex-col gap-4 overflow-y-auto pr-1">
            ${inviteCard}
            ${pendingSection}
            ${acceptedSection}
            ${pvpCard}
          </div>
          <button onclick="window.Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-auto px-6 self-center mt-2">
            VOLTAR
          </button>
        </div>
      </div>
    `;

    window.Renderer.renderGbaCard(content);
  },

  handleFriendLinkGeneration: async function () {
    const input = document.getElementById("friend-id-input");
    const feedback = document.getElementById("friendship-link-feedback");
    if (!input || !feedback) return;

    const friendId = input.value.trim();
    const baseClass = "mt-3 text-xs uppercase tracking-widest";

    if (!friendId) {
      feedback.textContent = "Informe o ID do amigo para gerar o link.";
      feedback.className = `${baseClass} text-rose-200`;
      return;
    }

    feedback.textContent = "Gerando link mágico...";
    feedback.className = `${baseClass} text-yellow-200`;

    try {
      const result = await window.PokeFriendship.sendFriendRequest(friendId);
      if (result.success && result.link) {
        input.value = "";
        feedback.innerHTML = `
          <div class="text-emerald-200">
            Link gerado! Compartilhe com seu amigo:
          </div>
          <div class="flex flex-col sm:flex-row gap-2 mt-2">
            <input id="friendship-link-output" type="text" value="${result.link}" readonly class="flex-1 p-2 border-2 border-emerald-400 rounded gba-font text-xs text-center bg-slate-800 text-emerald-100 shadow-inner">
            <button onclick="window.Renderer.copyFriendLink()" class="gba-button bg-emerald-500 hover:bg-emerald-600 sm:w-auto px-4" style="width:auto;">
              Copiar Link
            </button>
          </div>
        `;
        feedback.className = "";
      } else {
        feedback.textContent = result.message || "Não foi possível gerar o link.";
        feedback.className = `${baseClass} text-rose-200`;
      }
    } catch (error) {
      console.error("Erro ao gerar link de amizade:", error);
      feedback.textContent = "Erro inesperado ao gerar link. Tente novamente.";
      feedback.className = `${baseClass} text-rose-200`;
    }
  },

  copyFriendLink: async function () {
    const input = document.getElementById("friendship-link-output");
    if (!input) return;
    try {
      await navigator.clipboard.writeText(input.value);
      const feedback = document.getElementById("friendship-link-feedback");
      if (feedback) {
        feedback.insertAdjacentHTML(
          "beforeend",
          `<div class="mt-2 text-[10px] uppercase tracking-widest text-emerald-200">Link copiado! 🎉</div>`
        );
      }
    } catch (error) {
      console.error("Falha ao copiar link:", error);
      if (window.Utils) {
        window.Utils.showModal("errorModal", "Falha ao copiar o link. Copie manualmente.");
      }
    }
  },

  copyTrainerIdFromCard: async function () {
    const feedback = document.getElementById("friendship-copy-feedback");
    try {
      await navigator.clipboard.writeText(window.userId || "");
      if (feedback) {
        feedback.textContent = "ID copiado!";
        feedback.className = "mt-2 text-[10px] uppercase tracking-widest text-emerald-200";
        setTimeout(() => {
          feedback.textContent = "";
        }, 2000);
      }
    } catch (error) {
      console.error("Não foi possível copiar o ID:", error);
      if (feedback) {
        feedback.textContent = "Não foi possível copiar.";
        feedback.className = "mt-2 text-[10px] uppercase tracking-widest text-rose-200";
      }
    }
  },

  joinPvpFromFriendship: async function () {
    const input = document.getElementById("pvp-room-input");
    const feedback = document.getElementById("friendship-pvp-feedback");
    if (!input || !feedback) return;

    const roomId = input.value.trim().toUpperCase();
    const baseClass = "mt-3 text-xs uppercase tracking-widest";

    if (!roomId) {
      feedback.textContent = "Informe o código da sala para entrar.";
      feedback.className = `${baseClass} text-rose-200`;
      return;
    }

    feedback.textContent = `Conectando à sala ${roomId}...`;
    feedback.className = `${baseClass} text-yellow-200`;

    try {
      await window.PvpCore.joinPvpBattle(roomId);
      feedback.textContent = `Tentando entrar na sala ${roomId}. Verifique se o anfitrião aceitou!`;
      feedback.className = `${baseClass} text-emerald-200`;
    } catch (error) {
      console.error("Erro ao entrar na sala PvP:", error);
      feedback.textContent = "Erro ao entrar na sala. Confirme o código e tente novamente.";
      feedback.className = `${baseClass} text-rose-200`;
    }
  },

  challengeFriendToPvp: async function (friendId, friendName) {
    const feedback = document.getElementById("friendship-pvp-feedback");
    const baseClass = "mt-3 text-xs uppercase tracking-widest";
    if (feedback) {
      feedback.textContent = friendName
        ? `Criando sala para desafiar ${friendName}...`
        : "Criando sala PvP...";
      feedback.className = `${baseClass} text-yellow-200`;
    }
    try {
      await window.PvpCore.createPvpLink();
      if (feedback) {
        feedback.textContent = friendName
          ? `Sala criada! Compartilhe o link com ${friendName}.`
          : "Sala criada! Compartilhe o link com seus amigos.";
        feedback.className = `${baseClass} text-emerald-200`;
      }
    } catch (error) {
      console.error("Erro ao criar sala PvP:", error);
      if (feedback) {
        feedback.textContent = "Não foi possível criar a sala. Tente novamente.";
        feedback.className = `${baseClass} text-rose-200`;
      }
    }
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
    const prefs = (profile.preferences = profile.preferences || {});

    const avatarKey = prefs.avatarTrainerKey || TRAINER_AVATAR_CHOICES[0].key;
    const trainerImage = getTrainerAvatarUrl(profile);

    const avatarGrid = TRAINER_AVATAR_CHOICES
      .map((option) => {
        const isSelected = option.key === avatarKey;
        return `
          <button
            class="relative flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-900/70 border ${isSelected
            ? "border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.6)]"
            : "border-slate-700 hover:border-emerald-400 hover:shadow-[0_0_12px_rgba(52,211,153,0.35)]"
          } transition-all duration-200 group"
            onclick="window.Renderer.updateTrainerAvatar('${option.key}')"
            type="button"
          >
            <div class="w-20 h-20 flex items-center justify-center rounded-full bg-slate-800/80 ring-4 ${isSelected
            ? "ring-yellow-200"
            : "ring-slate-700 group-hover:ring-emerald-300"
          } overflow-hidden">
              <img
                src="${option.url}"
                alt="${option.label}"
                class="w-full h-full object-cover rounded-full"
              >
            </div>
            <span class="gba-font text-[10px] uppercase tracking-widest ${isSelected
            ? "text-yellow-200"
            : "text-gray-300 group-hover:text-emerald-200"
          }">
              ${option.label}
            </span>
            ${isSelected
            ? `<span class="absolute -top-2 -right-2 text-yellow-300"><i class="fa-solid fa-star"></i></span>`
            : ""
          }
          </button>
        `;
      })
      .join("");

    const isAnonymous = window.userId.startsWith("anonimo");

    const content = `
      <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font flex-shrink-0">PERFIL DO TREINADOR</div>
  
      <div class="space-y-4 text-sm gba-font flex-grow p-2 overflow-y-auto">
        <div class="bg-gradient-to-br from-rose-500 via-purple-600 to-sky-500 border-4 border-white/40 rounded-3xl p-5 shadow-2xl text-white">
          <div class="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            <div class="relative flex flex-col items-center">
              <div class="w-28 h-28 rounded-full bg-black/40 border-4 border-white/60 flex items-center justify-center shadow-2xl overflow-hidden">
                <img
                  src="${trainerImage}"
                  alt="Avatar selecionado"
                  class="w-full h-full object-cover rounded-full"
                >
              </div>
              <span class="mt-3 text-[10px] uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full">
                Avatar ${avatarKey.toUpperCase()}
              </span>
            </div>
  
            <div class="flex-1">
              <h2 class="text-lg uppercase tracking-widest">Galeria de Treinadores</h2>
              <p class="text-xs text-white/80 mb-3 uppercase tracking-widest">
                Escolha um avatar oficial da PokéAPI para representar seu perfil.
              </p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                ${avatarGrid}
              </div>
            </div>
          </div>
        </div>
            
        <div class="bg-white border-4 border-gray-800 rounded-2xl p-4 shadow-xl space-y-4 text-gray-800">
                <div>
            <label for="newTrainerName" class="block text-xs font-bold mb-1 uppercase">Nome:</label>
            <input
              id="newTrainerName"
              type="text"
              value="${profile.trainerName}"
              class="w-full p-2 border-2 border-gray-800 rounded gba-font text-sm text-center bg-white shadow-inner uppercase"
            >
                </div>

                <div>
            <p class="text-xs font-bold mb-1 uppercase">Gênero:</p>
                    <div class="flex justify-center space-x-4 text-xs">
              <label class="flex items-center space-x-2 px-3 py-2 rounded-lg border ${profile.trainerGender === "MALE" ? "border-blue-500 bg-blue-100" : "border-gray-300"} cursor-pointer transition">
                <input
                  type="radio"
                  name="newTrainerGender"
                  value="MALE"
                  ${profile.trainerGender === "MALE" ? "checked" : ""}
                  onclick="window.Renderer.updateGenderOnly('MALE')"
                >
                            <span>Homem</span>
                        </label>
              <label class="flex items-center space-x-2 px-3 py-2 rounded-lg border ${profile.trainerGender === "FEMALE" ? "border-pink-500 bg-pink-100" : "border-gray-300"} cursor-pointer transition">
                <input
                  type="radio"
                  name="newTrainerGender"
                  value="FEMALE"
                  ${profile.trainerGender === "FEMALE" ? "checked" : ""}
                  onclick="window.Renderer.updateGenderOnly('FEMALE')"
                >
                            <span>Mulher</span>
                        </label>
                    </div>
                </div>

          <div class="grid grid-cols-2 gap-3 text-xs uppercase tracking-widest">
            <div class="bg-gray-900 text-white border-2 border-gray-800 rounded-xl px-3 py-2 text-center shadow-inner">
              <span class="block text-[10px] text-gray-300">Dinheiro</span>
              <span class="text-sm">P$${profile.money}</span>
            </div>
            <div class="bg-gray-900 text-white border-2 border-gray-800 rounded-xl px-3 py-2 text-center shadow-inner">
              <span class="block text-[10px] text-gray-300">Pokémons</span>
              <span class="text-sm">${profile.pokemon.length}</span>
            </div>
          </div>

          <div class="mb-1">
            <p class="text-xs font-bold mb-1 uppercase">ID de Jogador (Para Amigos):</p>
            <div class="flex items-center space-x-1 border-2 border-gray-800 rounded bg-white shadow-inner px-2 py-1">
              <p
                style="font-size:7px;"
                class="gba-font truncate flex-grow text-gray-500 text-center select-all"
              >
                ${window.userId}
              </p>
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
            
        <div class="space-y-2">
          <button onclick="window.GameLogic.saveProfile()" class="gba-button bg-green-500 hover:bg-green-600 w-full">
            Salvar Perfil
          </button>
            ${isAnonymous
        ? `
            <div class="text-center text-xs gba-font text-gray-200">
                    Faça login para salvar na nuvem!
                </div>
                    <button
                        onclick="window.signInWithGoogle()"
                        class="gba-button bg-blue-500 hover:bg-blue-600 w-full flex items-center justify-center space-x-2"
                    >
                        <i class="fa-brands fa-google"></i>
                        <span>LOGIN COM GOOGLE</span>
                    </button>
          `
        : `
        <button onclick="window.signOutUser()" class="gba-button bg-red-500 hover:bg-red-600 w-full">
            LOGOUT
        </button>
          `}
    </div>

        <div class="border-t-2 border-gray-800 pt-4 space-y-3">
          <button onclick="window.GameLogic.exportSave()" class="gba-button bg-blue-500 hover:bg-blue-600 w-full">
            Exportar Save
          </button>
                <div class="relative">
            <input
              type="file"
              id="importFile"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onchange="window.GameLogic.importSave(event)"
            >
            <button class="gba-button bg-orange-500 hover:bg-orange-600 w-full">
              Importar Save
            </button>
          </div>
                </div>
            </div>
            
      <button onclick="window.Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full mt-4 flex-shrink-0">
        Voltar
      </button>
        `;
    window.Renderer.renderGbaCard(content);
  },

  updateTrainerAvatar: function (avatarKey) {
    const profile = window.gameState.profile;
    profile.preferences = profile.preferences || {};
    const validChoice = TRAINER_AVATAR_CHOICES.some(
      (choice) => choice.key === avatarKey
    );
    const nextKey = validChoice ? avatarKey : TRAINER_AVATAR_CHOICES[0].key;
    if (profile.preferences.avatarTrainerKey === nextKey) {
      return;
    }
    profile.preferences.avatarTrainerKey = nextKey;
    if (window.GameLogic?.saveGameData) {
      window.GameLogic.saveGameData();
    }
    window.Renderer.showScreen("profile");
  },
};