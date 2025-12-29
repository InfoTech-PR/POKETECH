// js/renderer_menus.js
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

if (typeof window.Renderer === "undefined") {
  window.Renderer = {};
}

const TRAINER_AVATAR_CHOICES = [
  {
    key: "default",
    label: "Avatar 1",
    url: "https://pbs.twimg.com/profile_images/1896626291606011904/IcRwMWBB.jpg",
  },
  {
    key: "alt1",
    label: "Avatar 2",
    url: "https://static.wikia.nocookie.net/pokepediabr/images/c/cd/182Bellossom.png/revision/latest?cb=20171211223455&path-prefix=pt-br",
  },
  {
    key: "alt2",
    label: "Avatar 3",
    url: "https://pm1.aminoapps.com/6761/d63cf8f1a27519a70c9e5b86c45a5b2bb1fe8f85v2_hq.jpg",
  },
  {
    key: "alt3",
    label: "Avatar 4",
    url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlWjHugl5ST10ChrNyv8VHfuFmVjZnTIATdg&s",
  },
  {
    key: "alt4",
    label: "Avatar 5",
    url: "https://i.redd.it/pokemon-scarlet-e-violet-na-copa-feito-por-mim-mesma-v0-sxwmn2n88k0a1.jpg?width=2814&format=pjpg&auto=webp&s=93cf4267551095bb519b3a9505ce29b7b93c83ee",
  },
  {
    key: "alt5",
    label: "Avatar 6",
    url: "https://i.redd.it/c8z5m7o3osk81.jpg",
  },
  {
    key: "alt6",
    label: "Avatar 7",
    url: "https://wallpapers-clan.com/wp-content/uploads/2023/11/pokemon-gengar-spooky-smile-black-background-scaled.jpg",
  },
  {
    key: "alt7",
    label: "Avatar 8",
    url: "https://oyster.ignimgs.com/wordpress/stg.ign.com/2012/10/SQUIRTLE.jpg",
  },
];

const getTrainerAvatarUrl = (profile) => {
  if (!profile) return TRAINER_AVATAR_CHOICES[0].url;
  const prefs = profile.preferences || {};

  // NOVO: Verifica se há uma imagem customizada do celular
  if (prefs.customAvatarImage) {
    return prefs.customAvatarImage;
  }

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
    navigator.clipboard
      .writeText(playerId)
      .then(() => {
        const originalHtml = copyIcon.dataset.originalHtml;

        copyIcon.innerHTML = `<i class="fa-solid fa-check"></i>`;
        copyIcon.classList.remove("text-blue-600", "hover:text-blue-800");
        copyIcon.classList.add("text-green-600");

        setTimeout(() => {
          copyIcon.innerHTML = originalHtml;
          copyIcon.classList.remove("text-green-600");
          copyIcon.classList.add("text-blue-600", "hover:text-blue-800");
        }, 1500);
      })
      .catch((err) => {
        console.error("Falha ao copiar usando navigator.clipboard:", err);
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
    document.execCommand("copy");

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
    console.error("Falha ao copiar o ID: ", err);
    window.Utils.showModal(
      "errorModal",
      "Falha ao copiar o ID. Por favor, copie manualmente."
    );
  }
  document.body.removeChild(textarea);
};

export const RendererMenus = {
  updateGenderOnly: function (gender) {
    window.gameState.profile.trainerGender = gender;
  },

  copyPlayerId: window.Renderer.copyPlayerId,
  fallbackCopy: fallbackCopy,

  // TELA DE LOGIN ESTILO POKÉMON
  renderInitialMenu: function (app) {
    const content = `
            <div class="h-full w-full flex flex-col items-center justify-center relative" style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);">
                <!-- Efeito de partículas/Pokébolas decorativas -->
                <div class="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    <div class="absolute top-10 left-10 w-16 h-16 bg-white rounded-full border-4 border-black" style="animation: float 3s ease-in-out infinite;"></div>
                    <div class="absolute top-32 right-20 w-12 h-12 bg-red-500 rounded-full border-4 border-black" style="animation: float 4s ease-in-out infinite 0.5s;"></div>
                    <div class="absolute bottom-20 left-20 w-10 h-10 bg-blue-500 rounded-full border-4 border-black" style="animation: float 3.5s ease-in-out infinite 1s;"></div>
                    <div class="absolute bottom-32 right-10 w-14 h-14 bg-yellow-400 rounded-full border-4 border-black" style="animation: float 4.5s ease-in-out infinite 1.5s;"></div>
                </div>

                <!-- Conteúdo Principal -->
                <div class="relative z-10 flex flex-col items-center justify-center w-full max-w-md px-6 py-8">
                    <!-- Logo/Título -->
                    <div class="mb-8 text-center">
                        <div class="mb-4 flex justify-center">
                            <div class="relative">
                                <div class="w-24 h-24 bg-white rounded-full border-8 border-black shadow-2xl flex items-center justify-center" style="background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%);">
                                    <div class="w-16 h-16 bg-red-500 rounded-full border-4 border-black"></div>
                                    <div class="absolute top-1/2 left-0 right-0 h-1 bg-black"></div>
                                    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2 border-black"></div>
                                </div>
                            </div>
                        </div>
                        <h1 class="text-4xl md:text-5xl font-bold gba-font mb-2" style="color: #fbbf24; text-shadow: 3px 3px 0px #000, 5px 5px 0px rgba(0,0,0,0.3); letter-spacing: 2px;">
                            POKÉTECH
                        </h1>
                        <p class="text-lg gba-font text-white" style="text-shadow: 2px 2px 0px #000;">
                            RPG DE POKÉMON
                        </p>
                    </div>

                    <!-- Card de Login -->
                    <div class="w-full bg-white rounded-lg border-4 border-black shadow-2xl p-6" style="background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);">
                        <div class="text-center mb-6">
                            <h2 class="text-2xl gba-font mb-2" style="color: #1e40af; text-shadow: 1px 1px 0px rgba(0,0,0,0.1);">
                                BEM-VINDO TREINADOR!
                            </h2>
                            <p class="text-sm gba-font text-gray-600">
                                Faça login para começar sua jornada
                            </p>
                        </div>

                        <!-- Botão de Login Google -->
                        <button
                            onclick="window.signInWithGoogle()"
                            class="w-full gba-button flex items-center justify-center space-x-3 py-4 text-base font-bold transition-all transform hover:scale-105 active:scale-95"
                            style="background: linear-gradient(135deg, #4285f4 0%, #34a853 50%, #fbbc05 100%); border: 4px solid #000; box-shadow: 0 4px 0 #000, 0 8px 16px rgba(0,0,0,0.2);"
                        >
                            <i class="fa-brands fa-google text-2xl" style="filter: drop-shadow(1px 1px 0px rgba(0,0,0,0.3));"></i>
                            <span class="gba-font" style="text-shadow: 2px 2px 0px rgba(0,0,0,0.3);">LOGIN COM GOOGLE</span>
                        </button>

                        <!-- Decoração inferior -->
                        <div class="mt-6 flex justify-center space-x-2">
                            <div class="w-2 h-2 bg-red-500 rounded-full border border-black"></div>
                            <div class="w-2 h-2 bg-blue-500 rounded-full border border-black"></div>
                            <div class="w-2 h-2 bg-yellow-400 rounded-full border border-black"></div>
                        </div>
                    </div>

                    <!-- Rodapé -->
                    <p class="mt-6 text-sm gba-font text-white text-center" style="text-shadow: 1px 1px 0px #000;">
                        Capture, batalhe e explore!
                    </p>
                </div>

                <style>
                    @keyframes float {
                        0%, 100% { transform: translateY(0px) rotate(0deg); }
                        50% { transform: translateY(-20px) rotate(5deg); }
                    }
                </style>
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
                                    <img src="../assets/sprites/pokemon/${
                                      starterSpriteIds[name]
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
    window.Renderer.renderStarterSelection(
      document.getElementById("app-container")
    );
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
    const exploreAction = isBetaMode
      ? `window.Renderer.showScreen('mapView')`
      : `window.GameLogic.explore()`;
    const exploreButtonText = isBetaMode ? "MAPA MUNDIAL (BETA)" : "ANDAR";
    const exploreButtonColor = isBetaMode
      ? "bg-orange-500 hover:bg-orange-600"
      : "bg-green-500 hover:bg-green-600";

    const allFainted =
      profile.pokemon.length > 0 &&
      profile.pokemon.every((p) => p.currentHp <= 0);

    const trainerImage = getTrainerAvatarUrl(profile);

    // NOVO: Usa o nível do treinador do profile (sistema de XP do treinador)
    const trainerLevel =
      typeof profile.trainerLevel === "number"
        ? Math.min(100, Math.max(1, profile.trainerLevel))
        : profile.pokemon.length > 0
        ? Math.min(
            100,
            Math.max(1, Math.max(...profile.pokemon.map((p) => p.level || 1)))
          )
        : 1;

    // Calcula pokémon capturados (pokedex)
    const pokedexCount = profile.pokedex
      ? profile.pokedex instanceof Set
        ? profile.pokedex.size
        : profile.pokedex.length
      : 0;

    // Determina cor do nível baseado no nível do treinador
    const getLevelColor = (level) => {
      if (level >= 50)
        return { bg: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)" };
      if (level >= 30)
        return { bg: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)" };
      if (level >= 20)
        return { bg: "linear-gradient(135deg, #22c55e 0%, #10b981 100%)" };
      if (level >= 10)
        return { bg: "linear-gradient(135deg, #eab308 0%, #f97316 100%)" };
      return { bg: "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)" };
    };

    const levelColor = getLevelColor(trainerLevel);
    const genderIcon = profile.trainerGender === "MALE" ? "♂" : "♀";
    const genderColor =
      profile.trainerGender === "MALE" ? "text-blue-400" : "text-pink-400";

    // NOVO: Obtém informações do evento semanal
    const weeklyEvent = window.GameConfig.getWeeklyEventRegions();
    const eventRegions = weeklyEvent.regions
      .map((regionId) => {
        const region = window.GameConfig.POKEDEX_REGIONS.find(
          (r) => r.id === regionId
        );
        return region ? region.name : regionId;
      })
      .join(" & ");

    const statsHtml = `
  <div class="trainer-profile-card">
    <!-- Header com avatar e nome -->
    <div class="trainer-profile-header">
      <div class="trainer-avatar-container">
        <img src="${trainerImage}" alt="Treinador" class="trainer-avatar">
        <div class="trainer-level-badge" style="background: ${levelColor.bg};">
          <span class="trainer-level-text">${trainerLevel}</span>
        </div>
      </div>
      <div class="trainer-info">
        <h2 class="trainer-name">${profile.trainerName}</h2>
        <div class="trainer-title">
          <span class="${genderColor} font-bold">${genderIcon}</span>
          <span>Treinador de Kanto</span>
        </div>
      </div>
    </div>
    
    <!-- Estatísticas em formato de cards -->
    <div class="trainer-stats-grid">
      <!-- Dinheiro -->
      <div class="stat-card stat-money">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-label">DINHEIRO</div>
          <div class="stat-value stat-value-money">P$${profile.money.toLocaleString(
            "pt-BR"
          )}</div>
        </div>
      </div>
      
      <!-- Pokémons no time -->
      <div class="stat-card stat-pokemon">
        <div class="stat-icon">⚡</div>
        <div class="stat-content">
          <div class="stat-label">TIME</div>
          <div class="stat-value stat-value-pokemon">${
            profile.pokemon.length
          } Pokémon</div>
        </div>
      </div>
      
      <!-- Pokédex -->
      <div class="stat-card stat-pokedex">
        <div class="stat-icon">📖</div>
        <div class="stat-content">
          <div class="stat-label">POKÉDEX</div>
          <div class="stat-value stat-value-pokedex">${pokedexCount} / 1025</div>
        </div>
      </div>
      
      <!-- Insígnias -->
      <div class="stat-card stat-badges">
        <div class="stat-icon">🏅</div>
        <div class="stat-content">
          <div class="stat-label">INSÍGNIAS</div>
          <div class="stat-value stat-value-badges">${
            profile.badges && Array.isArray(profile.badges)
              ? profile.badges.length
              : 0
          }</div>
        </div>
      </div>
    </div>
  </div>

  <style>
    .trainer-profile-card {
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 50%, #1e3a8a 100%);
      border: 4px solid #1e293b;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 20px rgba(59, 130, 246, 0.3);
      position: relative;
      overflow: hidden;
    }
    
    .trainer-profile-card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24);
      background-size: 200% 100%;
      animation: trainer-shimmer 3s infinite;
      z-index: 1;
    }
    
    @keyframes trainer-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    
    .trainer-profile-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
      position: relative;
      z-index: 2;
    }
    
    .trainer-avatar-container {
      position: relative;
      flex-shrink: 0;
    }
    
    .trainer-avatar {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      border: 3px solid #fbbf24;
      object-fit: cover;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      image-rendering: pixelated;
      background: #1e293b;
    }
    
    .trainer-level-badge {
      position: absolute;
      bottom: -6px;
      right: -6px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid #1e293b;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
      z-index: 3;
    }
    
    .trainer-level-text {
      font-size: 0.7rem;
      font-weight: 800;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      line-height: 1;
    }
    
    .trainer-info {
      flex: 1;
      min-width: 0;
    }
    
    .trainer-name {
      font-size: 1.1rem;
      font-weight: 800;
      color: #fbbf24;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .trainer-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.7rem;
      color: #94a3b8;
      font-weight: 600;
    }
    
    .trainer-stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      position: relative;
      z-index: 2;
    }
    
    .stat-card {
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      backdrop-filter: blur(4px);
      cursor: default;
    }
    
    .stat-card:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }
    
    .stat-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
      filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.3));
      line-height: 1;
    }
    
    .stat-content {
      flex: 1;
      min-width: 0;
    }
    
    .stat-label {
      font-size: 0.6rem;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
      line-height: 1.2;
    }
    
    .stat-value {
      font-size: 0.75rem;
      font-weight: 800;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      line-height: 1.2;
    }
    
    .stat-value-money {
      color: #86efac;
    }
    
    .stat-value-pokemon {
      color: #f87171;
    }
    
    .stat-value-pokedex {
      color: #60a5fa;
    }
    
    .stat-value-badges {
      color: #fbbf24;
    }
    
    /* Responsividade para telas maiores */
    @media (min-width: 640px) {
      .trainer-avatar {
        width: 80px;
        height: 80px;
      }
      
      .trainer-level-badge {
        width: 32px;
        height: 32px;
      }
      
      .trainer-level-text {
        font-size: 0.8rem;
      }
      
      .trainer-name {
        font-size: 1.3rem;
      }
      
      .trainer-stats-grid {
        gap: 10px;
      }
      
      .stat-card {
        padding: 12px;
      }
      
      .stat-icon {
        font-size: 1.8rem;
      }
      
      .stat-label {
        font-size: 0.65rem;
      }
      
      .stat-value {
        font-size: 0.85rem;
      }
    }
    
    /* Otimização para mobile */
    @media (max-width: 640px) {
      .trainer-profile-card {
        padding: 12px;
      }
      
      .trainer-profile-header {
        gap: 10px;
        margin-bottom: 12px;
        padding-bottom: 12px;
      }
      
      .trainer-stats-grid {
        gap: 6px;
      }
      
      .stat-card {
        padding: 8px;
      }
      
      .stat-icon {
        font-size: 1.3rem;
      }
    }
  </style>
          `;

    const menuHtml = `
            <div class="p-2">
                <!-- Grid de botões: 3 colunas x 3 linhas - apenas ícones -->
                <div class="menu-buttons-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: auto auto auto; gap: 8px;">
                    <!-- MEUS POKÉMONS - Primeira linha, esquerda -->
                    <button
                        onclick="window.Renderer.showScreen('pokemonList')"
                        class="gba-button bg-red-500 hover:bg-red-600 flex items-center justify-center"
                        style="grid-column: 1 / 2; grid-row: 1; min-height: 60px; aspect-ratio: 1;"
                        title="Meus Pokémons"
                    >
                        <i class="fa-solid fa-users text-2xl sm:text-3xl"></i>
                    </button>
                    <!-- MOCHILA - Primeira linha, centro -->
                    <button
                        onclick="window.Renderer.showScreen('bag')"
                        class="gba-button bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center"
                        style="grid-column: 2 / 3; grid-row: 1; min-height: 60px; aspect-ratio: 1;"
                        title="Mochila"
                    >
                        <i class="fa-solid fa-bag-shopping text-2xl sm:text-3xl"></i>
                    </button>
                    <!-- POKÉDEX - Primeira linha, direita -->
                    <button
                        onclick="window.Renderer.showScreen('pokedex')"
                        class="gba-button bg-orange-500 hover:bg-orange-600 flex items-center justify-center"
                        style="grid-column: 3 / 4; grid-row: 1; min-height: 60px; aspect-ratio: 1;"
                        title="Pokédex"
                    >
                        <i class="fa-solid fa-book text-2xl sm:text-3xl"></i>
                    </button>
                    <!-- LOJA - Segunda linha, esquerda -->
                    <button
                        onclick="window.Renderer.showScreen('shop')"
                        class="gba-button bg-cyan-500 hover:bg-cyan-600 flex items-center justify-center"
                        style="grid-column: 1 / 2; grid-row: 2; min-height: 60px; aspect-ratio: 1;"
                        title="Loja"
                    >
                        <i class="fa-solid fa-shop text-2xl sm:text-3xl"></i>
                    </button>
                    <!-- CENTRO - Segunda linha, centro -->
                    <button
                        onclick="window.Renderer.showScreen('healCenter')"
                        class="gba-button bg-pink-500 hover:bg-pink-600 flex items-center justify-center"
                        style="grid-column: 2 / 3; grid-row: 2; min-height: 60px; aspect-ratio: 1;"
                        title="Centro Pokémon"
                    >
                        <i class="fa-solid fa-hospital text-2xl sm:text-3xl"></i>
                    </button>
                    <!-- PVP - Segunda linha, direita -->
                    <button
                        onclick="window.Renderer.showScreen('pvpSetup')"
                        class="gba-button bg-purple-500 hover:bg-purple-600 flex items-center justify-center"
                        style="grid-column: 3 / 4; grid-row: 2; min-height: 60px; aspect-ratio: 1;"
                        title="Batalha PvP"
                    >
                        <i class="fa-solid fa-sword text-2xl sm:text-3xl"></i>
                    </button>
                    <!-- CONFIG - Terceira linha, ocupa toda a largura -->
                    <button
                        onclick="window.Renderer.showScreen('profileMenu')"
                        class="gba-button bg-gray-500 hover:bg-gray-600 flex items-center justify-center"
                        style="grid-column: 1 / 4; grid-row: 3; min-height: 50px;"
                        title="Configurações"
                    >
                        <i class="fa-solid fa-gear text-xl sm:text-2xl"></i>
                    </button>
                </div>
            </div>
        `;

    const exploreDisabled = allFainted && !isBetaMode ? "disabled" : "";

    const exploreLog = window.gameState.exploreLog || [];
    const exploreMsg =
      allFainted && !isBetaMode
        ? '<span class="text-red-500">TODOS DESMAIADOS! Vá para o Centro Pokémon.</span>'
        : exploreLog.length > 0
        ? exploreLog.slice(-1)[0]
        : "O que você fará?";

    // NOVO: Calcula batalhas restantes para Pokémon especial
    const normalBattleCount = profile.normalBattleCount || 0;
    // Se normalBattleCount % 10 === 0, a próxima batalha será evoluído (faltam 0)
    // Se normalBattleCount % 10 !== 0, faltam (10 - (normalBattleCount % 10))
    const battlesToEvolved =
      normalBattleCount % 10 === 0 ? 0 : 10 - (normalBattleCount % 10);
    // Se normalBattleCount % 100 === 0, a próxima batalha será lendário (faltam 0)
    // Se normalBattleCount % 100 !== 0, faltam (100 - (normalBattleCount % 100))
    const battlesToLegendary =
      normalBattleCount % 100 === 0 ? 0 : 100 - (normalBattleCount % 100);

    let specialIndicator = "";
    // Prioridade: se ambos são 0, lendário tem prioridade (mais raro)
    if (battlesToLegendary === 0 && normalBattleCount > 0) {
      specialIndicator =
        '<div class="text-xs font-bold text-yellow-300 gba-font mb-2 text-center animate-pulse" style="text-shadow: 2px 2px 0px #000;">⭐ PRÓXIMO: LENDÁRIO! ⭐</div>';
    } else if (battlesToEvolved === 0 && normalBattleCount > 0) {
      specialIndicator =
        '<div class="text-xs font-bold text-yellow-300 gba-font mb-2 text-center animate-pulse" style="text-shadow: 2px 2px 0px #000;">⚡ PRÓXIMO: EVOLUÍDO! ⚡</div>';
    } else {
      // Mostra o mais próximo
      const nextSpecial =
        battlesToEvolved <= battlesToLegendary
          ? battlesToEvolved
          : battlesToLegendary;
      const nextType =
        battlesToEvolved <= battlesToLegendary ? "EVOLUÍDO" : "LENDÁRIO";
      const nextIcon = battlesToEvolved <= battlesToLegendary ? "⚡" : "⭐";
      specialIndicator = `<div class="text-xs font-bold text-yellow-300 gba-font mb-2 text-center" style="text-shadow: 2px 2px 0px #000;">${nextIcon} ${nextSpecial} batalhas para ${nextType}</div>`;
    }

    const exploreHtml = `
            <div class="p-4 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 border-4 border-black rounded-lg shadow-2xl flex-shrink-0" style="background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1e40af 100%);">
                <div class="text-sm font-bold text-white gba-font mb-3 text-center" style="text-shadow: 2px 2px 0px #000;">
                    EXPLORAÇÃO RÁPIDA
                </div>
                ${specialIndicator}
                <div id="explore-result" class="min-h-[60px] max-h-[80px] text-xs gba-font mb-4 overflow-y-auto text-white p-3 rounded-lg" style="background: rgba(0, 0, 0, 0.3); border: 2px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(4px); text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.5);">
                    ${exploreMsg}
                </div>
                <div class="flex justify-center">
                    <button 
                        id="explore-action-btn" 
                        data-default-label="${exploreButtonText}" 
                        data-loading-label="Explorando..." 
                        onclick="handleExploreClick(event, '${exploreAction}')" 
                        class="pokeball-button ${exploreDisabled}" 
                        ${exploreDisabled}
                        style="position: relative; width: 80px; height: 80px; cursor: ${
                          exploreDisabled ? "not-allowed" : "pointer"
                        }; opacity: ${exploreDisabled ? "0.5" : "1"};"
                    >
                        <div class="pokeball-container" style="width: 100%; height: 100%; position: relative;">
                            <div class="pokeball-top" style="position: absolute; top: 0; left: 0; right: 0; height: 50%; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border: 4px solid #000; border-radius: 50px 50px 0 0; border-bottom: 2px solid #000;"></div>
                            <div class="pokeball-center" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background: #fff; border: 4px solid #000; border-radius: 50%; z-index: 2;"></div>
                            <div class="pokeball-bottom" style="position: absolute; bottom: 0; left: 0; right: 0; height: 50%; background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%); border: 4px solid #000; border-radius: 0 0 50px 50px; border-top: 2px solid #000;"></div>
                            <div class="pokeball-line" style="position: absolute; top: 50%; left: 0; right: 0; height: 4px; background: #000; z-index: 1;"></div>
                        </div>
                    </button>
                </div>
                <style>
                    .pokeball-button {
                        transition: transform 0.3s ease;
                    }
                    .pokeball-button:not(.disabled):hover {
                        transform: scale(1.1);
                    }
                    .pokeball-button.spinning .pokeball-container {
                        animation: spinPokeball 0.6s ease-in-out;
                    }
                    @keyframes spinPokeball {
                        0% { transform: rotate(0deg) scale(1); }
                        50% { transform: rotate(180deg) scale(1.2); }
                        100% { transform: rotate(360deg) scale(1); }
                    }
                    @media (max-width: 640px) {
                        .pokeball-button {
                            width: 70px !important;
                            height: 70px !important;
                        }
                        .pokeball-center {
                            width: 20px !important;
                            height: 20px !important;
                        }
                    }
                </style>
            </div>
        `;

    const combinedHtml = `
            <div class="flex flex-col gap-4 mb-4 flex-grow">
                <!-- Perfil do treinador -->
                <div class="w-full flex-shrink-0">
                    ${statsHtml}
                </div>
                <!-- Menu de ações -->
                <div class="w-full flex-shrink-0">
                    ${menuHtml}
                </div>
            </div>
            <div class="flex-shrink-0">
                ${exploreHtml}
            </div>
        `;

    window.Renderer.renderGbaCard(combinedHtml);

    // Adiciona botão flutuante de evento semanal
    const gbaScreen = document.querySelector(".gba-screen");
    if (gbaScreen && !document.querySelector(".weekly-event-button")) {
      const eventButton = document.createElement("button");
      eventButton.className = "weekly-event-button";
      eventButton.onclick = function () {
        if (window.Renderer && window.Renderer.showWeeklyEventModal) {
          window.Renderer.showWeeklyEventModal();
        } else {
          console.error("showWeeklyEventModal não encontrada");
        }
      };
      eventButton.setAttribute("title", "Eventos Semanais");
      eventButton.innerHTML = `
        <span style="font-size: 28px;">🎉</span>
        <span class="event-badge" style="
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ef4444;
          color: white;
          border: 2px solid #1e293b;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        ">!</span>
      `;
      eventButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
        border: 4px solid #1e293b;
        box-shadow: 0 4px 12px rgba(168, 85, 247, 0.5);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        transition: transform 0.2s, box-shadow 0.2s;
        animation: pulse-event 2s infinite;
      `;
      eventButton.onmouseover = function () {
        this.style.transform = "scale(1.1)";
        this.style.boxShadow = "0 6px 16px rgba(168, 85, 247, 0.7)";
      };
      eventButton.onmouseout = function () {
        this.style.transform = "scale(1)";
        this.style.boxShadow = "0 4px 12px rgba(168, 85, 247, 0.5)";
      };

      // Adiciona estilo de animação se não existir
      if (!document.getElementById("weekly-event-styles")) {
        const style = document.createElement("style");
        style.id = "weekly-event-styles";
        style.textContent = `
          @keyframes pulse-event {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @media (max-width: 640px) {
            .weekly-event-button {
              width: 50px !important;
              height: 50px !important;
              bottom: 15px !important;
              right: 15px !important;
            }
            .weekly-event-button span {
              font-size: 22px !important;
            }
          }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(eventButton);
    }

    // Função global para lidar com o clique na Pokébola
    window.handleExploreClick = async function (event, action) {
      event.preventDefault();
      const button = document.getElementById("explore-action-btn");
      const resultBox = document.getElementById("explore-result");

      if (!button || button.disabled) return;

      // Adiciona classe de spinning
      button.classList.add("spinning");
      button.disabled = true;
      button.style.cursor = "wait";

      // Atualiza o resultado com mensagem de loading
      if (resultBox) {
        resultBox.innerHTML =
          '<div class="flex items-center gap-2 text-gray-700 gba-font text-xs"><span class="inline-flex h-4 w-4 border-[3px] border-gray-400 border-t-transparent rounded-full animate-spin"></span><span>Procurando aventuras...</span></div>';
      }

      // Executa a ação após um pequeno delay para a animação
      setTimeout(async () => {
        try {
          // Remove a classe de spinning
          button.classList.remove("spinning");

          // Executa a ação (pode ser explore() ou showScreen('mapView'))
          if (action.includes("GameLogic.explore")) {
            await window.GameLogic.explore();
          } else if (action.includes("showScreen")) {
            window.Renderer.showScreen("mapView");
          } else {
            // Fallback: executa como código
            eval(action);
          }
        } catch (error) {
          console.error("Erro na exploração:", error);
          if (resultBox) {
            resultBox.innerHTML =
              '<span class="text-red-500">Erro ao explorar. Tente novamente.</span>';
          }
          button.disabled = false;
          button.style.cursor = "pointer";
        }
      }, 600); // Tempo da animação
    };
  },

  renderProfileMenu: function (app) {
    const content = `
      <div class="text-2xl font-bold text-center mb-6 text-white gba-font flex-shrink-0" style="text-shadow: 3px 3px 0px #000, 5px 5px 0px rgba(0,0,0,0.3); color: #fbbf24;">PERFIL E OPÇÕES</div>
    
      <div class="space-y-4 p-4 flex-grow overflow-y-auto">
        <button onclick="window.Renderer.showScreen('profile')" class="gba-button bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-3 py-4 text-base font-bold" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: 4px solid #000; box-shadow: 0 4px 0 #000, 0 8px 16px rgba(0,0,0,0.2);">
            <i class="fa-solid fa-user text-2xl"></i>
            <span>PERFIL DO TREINADOR</span>
        </button>
        <button onclick="window.Renderer.showScreen('friendshipMenu')" class="gba-button bg-orange-500 hover:bg-orange-600 flex items-center justify-center gap-3 py-4 text-base font-bold" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border: 4px solid #000; box-shadow: 0 4px 0 #000, 0 8px 16px rgba(0,0,0,0.2);">
            <i class="fa-solid fa-users text-2xl"></i>
            <span>AMIZADES & PVP</span>
        </button>
        <button onclick="window.Renderer.showScreen('preferences')" class="gba-button bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center gap-3 py-4 text-base font-bold" style="background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); border: 4px solid #000; box-shadow: 0 4px 0 #000, 0 8px 16px rgba(0,0,0,0.2);">
            <i class="fa-solid fa-gear text-2xl"></i>
            <span>PREFERÊNCIAS</span>
        </button>
      </div>
    
      <button onclick="window.Renderer.showScreen('mainMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0" style="border: 4px solid #000;">Voltar</button>
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

    if (
      !window.db ||
      !window.userId ||
      window.userId === "anonimo" ||
      window.userId === "anonimo-erro"
    ) {
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
        let friendAvatarUrl = null;
        try {
          const docRef = doc(window.db, "users", friendId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Busca o nome do treinador no perfil (pode estar em data.profile.trainerName ou data.trainerName)
            friendName =
              data.profile?.trainerName || data.trainerName || "Treinador";
            // NOVO: Busca o avatar do amigo
            if (data.preferences && data.preferences.avatarTrainerKey) {
              friendAvatarUrl = getTrainerAvatarUrl(data);
            } else {
              // Fallback para avatar padrão
              friendAvatarUrl = TRAINER_AVATAR_CHOICES[0].url;
            }
          } else {
            // Se não encontrou o perfil, usa nome padrão e avatar padrão
            friendName = "Treinador";
            friendAvatarUrl = TRAINER_AVATAR_CHOICES[0].url;
          }
        } catch (error) {
          console.warn("Falha ao buscar dados do amigo:", error);
          friendName = "Treinador";
          friendAvatarUrl = TRAINER_AVATAR_CHOICES[0].url;
        }

        return {
          id: f.id,
          friendId,
          friendName,
          friendAvatarUrl: friendAvatarUrl || TRAINER_AVATAR_CHOICES[0].url,
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
    const incoming = enriched.filter(
      (f) => f.status === "pending" && !f.isRequester
    );
    const outgoing = enriched.filter(
      (f) => f.status === "pending" && f.isRequester
    );

    const buildFriendCard = (friend) => {
      const safeName = escapeHtml(friend.friendName);
      const attrName = escapeAttr(friend.friendName);
      const sinceText = friend.since
        ? `<span class="text-[10px] uppercase tracking-widest text-emerald-200">Desde ${friend.since}</span>`
        : `<span class="text-[10px] uppercase tracking-widest text-emerald-200">Amigo confirmado</span>`;

      return `
        <div class="bg-slate-800/80 border border-emerald-400/60 rounded-xl p-4 shadow-inner hover:shadow-emerald-400/40 transition-shadow duration-200 flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg overflow-hidden border-2 border-emerald-300">
              <img src="${
                friend.friendAvatarUrl || TRAINER_AVATAR_CHOICES[0].url
              }" 
                   alt="${safeName}" 
                   class="w-full h-full object-cover"
                   onerror="this.src='${TRAINER_AVATAR_CHOICES[0].url}'">
            </div>
            <div>
              <div class="gba-font text-xs text-emerald-100">${safeName}</div>
              ${sinceText}
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button onclick="window.GameLogic.startTrade('${
              friend.friendId
            }', '${attrName}')" class="gba-button bg-green-500 hover:bg-green-600" style="width:auto;">
              Trocar Pokémon
            </button>
            <button onclick="window.PokeFriendship.removeFriendship('${
              friend.id
            }')" class="gba-button bg-red-500 hover:bg-red-600" style="width:auto;">
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
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-lg overflow-hidden border-2 border-amber-300">
              <img src="${
                friend.friendAvatarUrl || TRAINER_AVATAR_CHOICES[0].url
              }" 
                   alt="${safeName}" 
                   class="w-full h-full object-cover"
                   onerror="this.src='${TRAINER_AVATAR_CHOICES[0].url}'">
            </div>
            <div>
              <div class="gba-font text-xs text-amber-100">${safeName}</div>
              ${sentOn}
            </div>
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
          <h2 class="gba-font text-sm text-emerald-200 tracking-widest">AMIGOS DISPONÍVEIS (${
            accepted.length
          })</h2>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          ${
            accepted.length > 0
              ? accepted.map(buildFriendCard).join("")
              : emptyMessage(
                  "fa-sparkles",
                  "SEM AMIGOS CONFIRMADOS AINDA. ENVIE UM PEDIDO!"
                )
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
              <i class="fa-solid fa-inbox text-amber-200"></i> Recebidas (${
                incoming.length
              })
            </div>
            ${
              incoming.length > 0
                ? incoming.map((f) => buildRequestCard(f, true)).join("")
                : emptyMessage(
                    "fa-hand-holding-heart",
                    "NENHUM PEDIDO RECEBIDO NO MOMENTO."
                  )
            }
          </div>
          <div class="bg-slate-800/70 rounded-xl p-3 flex flex-col gap-2 border border-amber-400/40">
            <div class="flex items-center gap-2 text-xs text-amber-100 uppercase tracking-widest">
              <i class="fa-solid fa-paper-plane text-amber-200"></i> Enviadas (${
                outgoing.length
              })
            </div>
            ${
              outgoing.length > 0
                ? outgoing.map((f) => buildRequestCard(f, false)).join("")
                : emptyMessage(
                    "fa-paper-plane",
                    "VOCÊ NÃO ENVIOU NENHUM CONVITE AINDA."
                  )
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
              Use seu ID para conectar treinadores e fazer novas amizades.
            </p>
          </div>
          <div class="bg-black/40 border border-white/40 rounded-xl px-4 py-3 text-center shadow-lg">
            <div class="text-[10px] text-white/70 uppercase tracking-widest mb-1">Seu ID de treinador</div>
            <div class="gba-font text-sm text-white tracking-widest break-all">${escapeHtml(
              window.userId
            )}</div>
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

    const content = `
      <div class="gba-card-wrapper text-white">
        <div class="flex flex-col h-full gap-4">
          ${friendCodeCard}
          <div class="flex flex-col gap-4 overflow-y-auto pr-1">
            ${inviteCard}
            ${pendingSection}
            ${acceptedSection}
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
        feedback.textContent =
          result.message || "Não foi possível gerar o link.";
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
        window.Utils.showModal(
          "errorModal",
          "Falha ao copiar o link. Copie manualmente."
        );
      }
    }
  },

  copyTrainerIdFromCard: async function () {
    const feedback = document.getElementById("friendship-copy-feedback");
    try {
      await navigator.clipboard.writeText(window.userId || "");
      if (feedback) {
        feedback.textContent = "ID copiado!";
        feedback.className =
          "mt-2 text-[10px] uppercase tracking-widest text-emerald-200";
        setTimeout(() => {
          feedback.textContent = "";
        }, 2000);
      }
    } catch (error) {
      console.error("Não foi possível copiar o ID:", error);
      if (feedback) {
        feedback.textContent = "Não foi possível copiar.";
        feedback.className =
          "mt-2 text-[10px] uppercase tracking-widest text-rose-200";
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
      feedback.textContent =
        "Erro ao entrar na sala. Confirme o código e tente novamente.";
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
        feedback.textContent =
          "Não foi possível criar a sala. Tente novamente.";
        feedback.className = `${baseClass} text-rose-200`;
      }
    }
  },

  renderPokemonMenu: function (app) {
    const content = `
            <div class="text-2xl font-bold text-center mb-6 text-white gba-font flex-shrink-0" style="text-shadow: 3px 3px 0px #000, 5px 5px 0px rgba(0,0,0,0.3); color: #fbbf24;">MEU TIME</div>
            
            <div class="space-y-4 p-4 flex-grow overflow-y-auto">
                <button onclick="window.Renderer.showScreen('pokemonList')" class="gba-button bg-red-500 hover:bg-red-600 flex items-center justify-center gap-3 py-4 text-base font-bold" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border: 4px solid #000; box-shadow: 0 4px 0 #000, 0 8px 16px rgba(0,0,0,0.2);">
                    <i class="fa-solid fa-users text-2xl"></i>
                    <span>VER POKÉMONS</span>
                </button>
                <button onclick="window.Renderer.showScreen('bag')" class="gba-button bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center gap-3 py-4 text-base font-bold" style="background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); border: 4px solid #000; box-shadow: 0 4px 0 #000, 0 8px 16px rgba(0,0,0,0.2);">
                    <i class="fa-solid fa-bag-shopping text-2xl"></i>
                    <span>MOCHILA</span>
                </button>
                <button onclick="window.Renderer.showScreen('pokedex')" class="gba-button bg-orange-500 hover:bg-orange-600 flex items-center justify-center gap-3 py-4 text-base font-bold" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border: 4px solid #000; box-shadow: 0 4px 0 #000, 0 8px 16px rgba(0,0,0,0.2);">
                    <i class="fa-solid fa-book text-2xl"></i>
                    <span>POKÉDEX</span>
                </button>
                <button onclick="window.Renderer.showScreen('incubator')" class="gba-button bg-pink-500 hover:bg-pink-600 flex items-center justify-center gap-3 py-4 text-base font-bold" style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); border: 4px solid #000; box-shadow: 0 4px 0 #000, 0 8px 16px rgba(0,0,0,0.2);">
                    <i class="fa-solid fa-egg text-2xl"></i>
                    <span>INCUBADORA</span>
                </button>
            </div>
            
            <button onclick="window.Renderer.showScreen('mainMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0" style="border: 4px solid #000;">Voltar</button>
        `;
    window.Renderer.renderGbaCard(content);
  },

  renderPreferences: function (app) {
    const prefs = window.gameState.profile.preferences;
    const volumePercent = Math.round(prefs.volume * 100);
    const isMuted = prefs.isMuted;
    const isBetaMode = prefs.isBetaMode;

    const content = `
          <div class="text-2xl font-bold text-center mb-6 text-white gba-font flex-shrink-0" style="text-shadow: 3px 3px 0px #000, 5px 5px 0px rgba(0,0,0,0.3); color: #fbbf24;">PREFERÊNCIAS</div>
          
          <div class="p-4 rounded-lg mb-6 flex-grow overflow-y-auto" style="background: rgba(255, 255, 255, 0.1); border: 3px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(4px);">
              
              <div class="text-sm font-bold text-white gba-font mb-4 pb-3 flex justify-between items-center border-b" style="border-color: rgba(255, 255, 255, 0.2); text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.5);">
                  <span>MODO BETA</span>
                  <button onclick="window.Utils.toggleBetaMode()" 
                          class="gba-button w-28 h-9 text-[10px] ${
                            isBetaMode
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-green-500 hover:bg-green-600"
                          }" style="border: 3px solid #000;">
                      ${isBetaMode ? "DESATIVAR" : "ATIVAR"}
                  </button>
              </div>
              <p class="text-xs gba-font text-white mb-6" style="text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.5);">
                ${
                  isBetaMode
                    ? 'Ativado. A tela "Explorar" agora é o Mapa Mundial (WIP).'
                    : "Desativado. A navegação será por texto e botões."
                }
              </p>

              <div class="text-sm font-bold text-white gba-font mb-4 pb-3 border-b" style="border-color: rgba(255, 255, 255, 0.2); text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.5);">CONTROLE DE SOM</div>
              
              <div class="mb-6">
                  <label for="volumeSlider" class="block text-xs font-bold gba-font mb-3 text-white" style="text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.5);">
                      Volume da Música: ${volumePercent}%
                  </label>
                  <input type="range" id="volumeSlider" min="0" max="1" step="0.01" value="${
                    prefs.volume
                  }" 
                         oninput="window.updateVolume(this.value)"
                         class="w-full h-3 rounded-lg appearance-none cursor-pointer" style="background: rgba(255, 255, 255, 0.2); border: 2px solid #000;">
              </div>

              <button onclick="window.toggleMute()" 
                      class="gba-button w-full py-4 text-base font-bold ${
                        isMuted
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      }" style="border: 4px solid #000; box-shadow: 0 4px 0 #000, 0 8px 16px rgba(0,0,0,0.2);">
                  <i class="fa-solid ${
                    isMuted ? "fa-volume-xmark" : "fa-volume-high"
                  } mr-2"></i>
                  ${
                    isMuted
                      ? "SOM MUDO (CLIQUE PARA LIGAR)"
                      : "SOM LIGADO (CLIQUE PARA MUTAR)"
                  }
              </button>
              <p class="text-xs gba-font text-white mt-2 text-center" style="text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.5);">(O volume atual do jogo é ${
                isMuted ? "MUDO" : "LIGADO"
              })</p>

          </div>
          
          <button onclick="window.Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full flex-shrink-0" style="border: 4px solid #000;">Voltar</button>
      `;
    window.Renderer.renderGbaCard(content);
  },

  renderProfile: function (app) {
    const profile = window.gameState.profile;
    const prefs = profile.preferences || {};
    const trainerImage = getTrainerAvatarUrl(profile);
    const isAnonymous = window.userId.startsWith("anonimo");

    const content = `
      <div class="space-y-4 text-sm gba-font flex-grow p-2 overflow-y-auto">
        <!-- Foto do Perfil -->
        <div class="flex flex-col items-center gap-3">
          <div class="relative">
            <div class="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-800 shadow-lg">
              <img
                src="${trainerImage}"
                alt="Foto do Perfil"
                class="w-full h-full object-cover"
              >
            </div>
          </div>
          <div class="relative w-full">
            <input
              type="file"
              id="customAvatarInput"
              accept="image/*"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onchange="window.Renderer.handleCustomAvatarUpload(event)"
            >
            <button class="gba-button bg-purple-500 hover:bg-purple-600 w-full text-xs flex items-center justify-center gap-2">
              <i class="fa-solid fa-image"></i>
              <span>Editar Foto</span>
            </button>
          </div>
          ${
            prefs.customAvatarImage
              ? `
            <button onclick="window.Renderer.removeCustomAvatar()" class="gba-button bg-red-500 hover:bg-red-600 w-full text-xs flex items-center justify-center gap-2">
              <i class="fa-solid fa-trash"></i>
              <span>Remover Foto</span>
            </button>
          `
              : ""
          }
        </div>

        <!-- Nome do Usuário -->
        <div>
          <label for="newTrainerName" class="block text-xs font-bold mb-1 uppercase text-gray-800">Nome:</label>
          <input
            id="newTrainerName"
            type="text"
            value="${profile.trainerName}"
            class="w-full p-2 border-2 border-gray-800 rounded gba-font text-sm text-center bg-white shadow-inner uppercase"
          >
        </div>

        <!-- Card de Nível -->
          ${(() => {
            const trainerLevel =
              typeof profile.trainerLevel === "number"
                ? profile.trainerLevel
                : 1;
            const trainerExp =
              typeof profile.trainerExp === "number" ? profile.trainerExp : 0;
            const expToNext = window.Utils
              ? window.Utils.calculateTrainerExpToNextLevel(trainerLevel)
              : 100 * trainerLevel * trainerLevel;
            const expPercent =
              trainerLevel >= 100
                ? 100
                : Math.min(100, Math.floor((trainerExp / expToNext) * 100));

            return `
            <div class="bg-gradient-to-r from-blue-900 to-purple-900 text-white border-2 border-gray-800 rounded-xl p-3 shadow-inner">
              <div class="flex justify-between items-center mb-2">
                <span class="text-[10px] text-gray-300 uppercase">Nível do Treinador</span>
                <span class="text-sm font-bold">Nv. ${trainerLevel}</span>
              </div>
              <div class="mb-2">
                <div class="flex justify-between text-[10px] mb-1">
                  <span>XP: ${trainerExp.toLocaleString("pt-BR")}</span>
                  <span>Próximo: ${expToNext.toLocaleString("pt-BR")}</span>
                </div>
                <div class="w-full bg-gray-800 rounded-full h-3 border-2 border-gray-900 overflow-hidden">
                  <div class="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 h-full transition-all duration-300" style="width: ${expPercent}%; box-shadow: 0 0 10px rgba(251, 191, 36, 0.5);"></div>
                </div>
              </div>
              ${
                trainerLevel >= 100
                  ? '<div class="text-[10px] text-center text-yellow-300">Nível Máximo!</div>'
                  : `<div class="text-[10px] text-center text-gray-400">${expPercent}% para próximo nível</div>`
              }
            </div>
            `;
          })()}
            
        <!-- 3 Botões lado a lado -->
        <div class="grid grid-cols-3 gap-2">
          <button onclick="window.GameLogic.saveProfile()" class="gba-button bg-green-500 hover:bg-green-600 flex items-center justify-center" title="Salvar Perfil">
            <i class="fa-solid fa-floppy-disk text-lg"></i>
          </button>
          ${
            isAnonymous
              ? `
              <button
                  onclick="window.signInWithGoogle()"
                  class="gba-button bg-blue-500 hover:bg-blue-600 flex items-center justify-center"
                  title="Login com Google"
              >
                  <i class="fa-brands fa-google text-lg"></i>
              </button>
        `
              : `
          <button onclick="window.signOutUser()" class="gba-button bg-red-500 hover:bg-red-600 flex items-center justify-center" title="Logout">
              <i class="fa-solid fa-sign-out-alt text-lg"></i>
          </button>
        `
          }
          <button onclick="window.Renderer.showScreen('profileMenu')" class="gba-button bg-gray-500 hover:bg-gray-600 flex items-center justify-center" title="Voltar">
            <i class="fa-solid fa-arrow-left text-lg"></i>
          </button>
        </div>
      </div>
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
    // NOVO: Remove imagem customizada ao escolher um avatar padrão
    if (profile.preferences.customAvatarImage) {
      delete profile.preferences.customAvatarImage;
    }
    profile.preferences.avatarTrainerKey = nextKey;
    if (window.GameLogic?.saveGameData) {
      window.GameLogic.saveGameData();
    }
    window.Renderer.showScreen("profile");
  },

  // NOVO: Função para fazer upload de imagem customizada
  handleCustomAvatarUpload: function (event) {
    const file = event.target.files[0];
    if (!file) return;

    // Valida se é uma imagem
    if (!file.type.startsWith("image/")) {
      window.Utils.showModal(
        "errorModal",
        "Por favor, selecione um arquivo de imagem válido."
      );
      return;
    }

    // Limita o tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      window.Utils.showModal(
        "errorModal",
        "A imagem deve ter no máximo 2MB. Por favor, escolha uma imagem menor."
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const profile = window.gameState.profile;
        profile.preferences = profile.preferences || {};

        // Salva a imagem como base64
        profile.preferences.customAvatarImage = e.target.result;

        // Remove a seleção de avatar padrão quando usa imagem customizada
        if (profile.preferences.avatarTrainerKey) {
          delete profile.preferences.avatarTrainerKey;
        }

        // Salva os dados e aguarda a conclusão
        if (window.GameLogic?.saveGameData) {
          await window.GameLogic.saveGameData();
        }

        // Recarrega a tela de perfil
        window.Renderer.showScreen("profile");

        window.Utils.showModal(
          "infoModal",
          "Foto de perfil atualizada com sucesso!"
        );
      } catch (error) {
        console.error("Erro ao salvar foto de perfil:", error);
        window.Utils.showModal(
          "errorModal",
          "Erro ao salvar foto de perfil. Tente novamente."
        );
      }
    };

    reader.onerror = function () {
      window.Utils.showModal(
        "errorModal",
        "Erro ao ler a imagem. Tente novamente."
      );
    };

    // Lê a imagem como Data URL (base64)
    reader.readAsDataURL(file);

    // Limpa o input para permitir selecionar o mesmo arquivo novamente
    event.target.value = "";
  },

  // NOVO: Função para remover imagem customizada
  removeCustomAvatar: async function () {
    try {
      const profile = window.gameState.profile;
      if (!profile.preferences) {
        profile.preferences = {};
      }

      if (profile.preferences.customAvatarImage) {
        delete profile.preferences.customAvatarImage;

        // Volta para o avatar padrão
        if (!profile.preferences.avatarTrainerKey) {
          profile.preferences.avatarTrainerKey = TRAINER_AVATAR_CHOICES[0].key;
        }

        // Salva os dados e aguarda a conclusão
        if (window.GameLogic?.saveGameData) {
          await window.GameLogic.saveGameData();
        }

        // Recarrega a tela de perfil
        window.Renderer.showScreen("profile");

        window.Utils.showModal("infoModal", "Foto customizada removida!");
      }
    } catch (error) {
      console.error("Erro ao remover foto de perfil:", error);
      window.Utils.showModal(
        "errorModal",
        "Erro ao remover foto de perfil. Tente novamente."
      );
    }
  },

  showWeeklyEventModal: function () {
    const weeklyEvent = window.GameConfig.getWeeklyEventRegions();
    const eventRegions = weeklyEvent.regions
      .map((regionId) => {
        const region = window.GameConfig.POKEDEX_REGIONS.find(
          (r) => r.id === regionId
        );
        return region ? region.name : regionId;
      })
      .join(" & ");

    const modalContent = `
      <div class="text-2xl mb-4">🎉</div>
      <div class="text-xl font-bold text-purple-800 gba-font mb-2">EVENTO SEMANAL</div>
      <div class="text-sm gba-font text-purple-700 mb-4">Esta Semana</div>
      <div class="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-lg p-4 mb-4">
        <div class="text-lg font-bold text-purple-900 gba-font mb-2">${weeklyEvent.theme}</div>
        <div class="text-sm text-purple-800 gba-font">
          <strong>Regiões Ativas:</strong><br>
          ${eventRegions}
        </div>
      </div>
      <div class="text-xs text-purple-600 gba-font mb-4">
        🎯 Batalhe nestas regiões para encontrar Pokémon especiais!
      </div>
      <button
        onclick="window.Utils.hideModal('weeklyEventModal')"
        class="gba-button bg-purple-500 hover:bg-purple-600 w-full mt-2">
        Fechar
      </button>
    `;

    const modal = document.getElementById("weeklyEventModal");
    if (modal) {
      const modalBody = modal.querySelector(".weekly-event-modal-body");
      if (modalBody) {
        modalBody.innerHTML = modalContent;
      }
      // Remove a classe hidden para mostrar a modal
      modal.classList.remove("hidden");
    }
  },
};
