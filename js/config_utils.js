// config_utils.js
// MÓDULO DE CONFIGURAÇÕES E UTILS
// O arquivo agora exporta uma função assíncrona que inicializa todas as constantes após carregar os dados locais com cache-busting.

export async function createConfigAndUtils(v) {
  // Importação dinâmica com cache-busting (V = "?v=123456789")
  // O módulo local_poke_data.js é carregado aqui para garantir que esteja atualizado.
  const [localDataModule, branchedEvosModule] = await Promise.all([
    import(`./local_poke_data.js${v}`),
    import(`./branched_evos.js${v}`),
  ]);

  const { POKE_DATA, SPECIES_DATA, EVOLUTION_CHAINS, REVERSE_BRANCHED_EVOS } = localDataModule;
  const { BRANCHED_EVOS } = branchedEvosModule; // Importa as regras de ramificação

  // 1. Definição do GameConfig
  const DEFAULT_NORMAL_MOVE_MAX_USES = 25;

  const GameConfig = {
    POKEBALL_BASE_CATCH_RATE: 100,
    STARTERS: ["bulbasaur", "charmander", "squirtle"],
    EVOLUTION_COST: 500,
    HEAL_COST_PER_POKE: 50,
    NORMAL_MOVE_MAX_USES: 25,
    SHOP_ITEMS: [
      {
        name: "Pokébola",
        quantity: 0,
        catchRate: 0.5,
        cost: 200,
        spriteUrl:
          "../assets/sprites/items/poke-ball.png",
      },
      {
        name: "Great Ball",
        quantity: 0,
        catchRate: 1.0,
        cost: 600,
        spriteUrl:
          "../assets/sprites/items/great-ball.png",
      },
      {
        name: "Ultra Ball",
        quantity: 0,
        catchRate: 1.5,
        cost: 1200,
        spriteUrl:
          "../assets/sprites/items/ultra-ball.png",
      },
      {
        name: "Poção",
        quantity: 0,
        healAmount: 20,
        cost: 300,
        spriteUrl:
          "../assets/sprites/items/potion.png",
      },
      {
        name: "Éter",
        quantity: 0,
        ppRestore: true,
        cost: 500,
        spriteUrl:
          "../assets/sprites/items/potion.png",
        defaultQuantity: 2,
      },
    ],
    // Limite da Pokédex baseado nos dados locais
    POKEDEX_LIMIT: Object.keys(POKE_DATA).length,
    EXP_BASE: 100,
    EXP_GROWTH_RATE: 1.35,
    HP_BASE_MULTIPLIER: 0.8,
    HP_LEVEL_MULTIPLIER: 0.25,

    // NOVO: Mapeamento de Regiões
    POKEDEX_REGIONS: [
      { name: "KANTO", id: "kanto", startId: 1, endId: 151, starters: [1, 4, 7] },
      { name: "JOHTO", id: "johto", startId: 152, endId: 251, starters: [152, 155, 158] },
      { name: "HOENN", id: "hoenn", startId: 252, endId: 386, starters: [252, 255, 258] },
      { name: "SINNOH", id: "sinnoh", startId: 387, endId: 493, starters: [387, 390, 393] },
      { name: "UNOVA", id: "unova", startId: 494, endId: 649, starters: [495, 498, 501] },
      { name: "KALOS", id: "kalos", startId: 650, endId: 721, starters: [650, 653, 656] },
      { name: "ALOLA", id: "alola", startId: 722, endId: 809, starters: [722, 725, 728] },
      { name: "GALAR", id: "galar", startId: 810, endId: 898, starters: [810, 813, 816] },
      { name: "PALDEA", id: "paldea", startId: 906, endId: 1025, starters: [906, 909, 912] },
    ],

    // ====================================================================
    // NOVO: CONFIGURAÇÃO DE CLIMA
    // ====================================================================
    WEATHER_API_URL: "https://api.open-meteo.com/v1/forecast",
    // Mapeamento WMO Code -> Nome no Jogo e Ícone FontAwesome
    WEATHER_MAP: {
      0: { name: "Céu Limpo", icon: "fa-sun", color: "text-yellow-500" }, // Clear sky
      1: { name: "Parcialmente Nublado", icon: "fa-cloud-sun", color: "text-yellow-400" }, // Mostly clear
      2: { name: "Nublado", icon: "fa-cloud-sun-rain", color: "text-gray-400" }, // Partly cloudy
      3: { name: "Céu Encoberto", icon: "fa-cloud", color: "text-gray-600" }, // Overcast
      45: { name: "Névoa", icon: "fa-smog", color: "text-gray-500" }, // Fog
      48: { name: "Névoa Congelante", icon: "fa-icicles", color: "text-blue-200" }, // Depositing rime fog
      51: { name: "Chuvisco Leve", icon: "fa-cloud-drizzle", color: "text-blue-500" }, // Drizzle: Light
      53: { name: "Chuvisco Moderado", icon: "fa-cloud-drizzle", color: "text-blue-600" }, // Drizzle: Moderate
      55: { name: "Chuvisco Intenso", icon: "fa-cloud-showers-heavy", color: "text-blue-700" }, // Drizzle: Dense
      61: { name: "Chuva Leve", icon: "fa-cloud-rain", color: "text-blue-500" }, // Rain: Slight
      63: { name: "Chuva Moderada", icon: "fa-cloud-showers-heavy", color: "text-blue-600" }, // Rain: Moderate
      65: { name: "Chuva Forte", icon: "fa-cloud-showers-heavy", color: "text-blue-700" }, // Rain: Heavy
      71: { name: "Neve Leve", icon: "fa-snowflakes", color: "text-blue-300" }, // Snow fall: Slight
      73: { name: "Neve Moderada", icon: "fa-snowflake", color: "text-blue-400" }, // Snow fall: Moderate
      75: { name: "Neve Forte", icon: "fa-icicles", color: "text-blue-500" }, // Snow fall: Heavy
      95: { name: "Trovoada", icon: "fa-bolt", color: "text-yellow-600" }, // Thunderstorm: Slight or moderate
      99: { name: "Trovoada Forte", icon: "fa-cloud-bolt", color: "text-yellow-700" }, // Thunderstorm with heavy hail
    },
  };

  const DEFAULT_NORMAL_MOVE = "tackle";
  const SPECIAL_MOVE_MAX_USES = 10;
  const TYPE_SPECIAL_MOVES = {
    normal: "headbutt",
    fire: "ember",
    water: "water-gun",
    grass: "vine-whip",
    electric: "thunder-shock",
    ground: "mud-slap",
    rock: "rock-throw",
    ice: "ice-beam",
    bug: "bug-bite",
    psychic: "confusion",
    dark: "bite",
    ghost: "night-shade",
    steel: "iron-head",
    fighting: "karate-chop",
    poison: "poison-sting",
    flying: "gust",
    dragon: "dragon-breath",
    fairy: "disarming-voice",
  };

  GameConfig.TYPE_SPECIAL_MOVES = TYPE_SPECIAL_MOVES;
  GameConfig.SPECIAL_MOVE_MAX_USES = SPECIAL_MOVE_MAX_USES;
  GameConfig.DEFAULT_NORMAL_MOVE = DEFAULT_NORMAL_MOVE;

  // 2. Definição do initializeGameState
  function initializeGameState() {
    window.gameState = {
      profile: {
        trainerName: "NOVO TREINADOR",
        money: 3000,
        items: GameConfig.SHOP_ITEMS.map((item) => ({
          ...item,
          quantity:
            item.defaultQuantity !== undefined
              ? item.defaultQuantity
              : item.name === "Pokébola"
              ? 10
              : 5,
        })),
        pokemon: [],
        trainerGender: "MALE",
        pokedex: new Set(),
        preferences: {
          volume: 0.5,
          isMuted: false,
          isBetaMode: false, // NOVO: Flag para o modo Beta
        },
        // NOVO: Última Localização (Usado para o mapa)
        lastLocation: {
          lat: -25.5317, // Default: Curitiba, PR, Brasil (Ponto central razoável)
          lng: -49.2707,
          timestamp: Date.now(),
        },
      },
      pokedexCache: {}, // Garante que o cache é inicializado como objeto vazio
      currentScreen: "mainMenu",
      battle: null,
      pvpRoomId: null,
      exploreLog: ["Bem-vindo ao Pokémon GBA RPG!"],
      pendingSupportItem: null,

      // NOVO: Estado do clima
      currentWeather: {
        isDay: true,
        temperature: null, // Celsius
        condition: "Céu Limpo", // Nome legível
        icon: "fa-sun", // Ícone FontAwesome
        rawCode: 0,
        lastFetch: 0,
      }
    };
  }

  // 3. Definição do Utils
  const Utils = {
    saveGame: function () {
      try {
        const stateToSave = { ...window.gameState };
        delete stateToSave.battle;
        delete stateToSave.pvpRoomId;

        const profileToSave = {
          ...stateToSave.profile,
          pokedex: Array.from(stateToSave.profile.pokedex),
        };

        localStorage.setItem(
          "pokemonGamePokedexCache",
          JSON.stringify(stateToSave.pokedexCache)
        );
        localStorage.setItem("pokemonGameProfile", JSON.stringify(profileToSave));
        localStorage.setItem(
          "pokemonGameExploreLog",
          JSON.stringify(stateToSave.exploreLog)
        );
        console.log("Jogo Salvo com Sucesso!");
      } catch (error) {
        console.error("Erro ao salvar jogo:", error);
      }
    },

    loadGame: function () {
      try {
        const savedProfile = localStorage.getItem("pokemonGameProfile");
        const savedExploreLog = localStorage.getItem("pokemonGameExploreLog");
        const savedPokedexCache = localStorage.getItem("pokemonGamePokedexCache");

        if (savedProfile) {
          window.gameState.profile = JSON.parse(savedProfile);

          if (window.gameState.profile.pokedex) {
            if (!Array.isArray(window.gameState.profile.pokedex)) {
              console.warn(
                "Pokedex carregada com formato inválido. Inicializando como array vazio."
              );
              window.gameState.profile.pokedex = [];
            }
            window.gameState.profile.pokedex = new Set(
              window.gameState.profile.pokedex
            );
          } else {
            window.gameState.profile.pokedex = new Set();
          }

          window.gameState.pokedexCache = savedPokedexCache
            ? JSON.parse(savedPokedexCache)
            : {};

          if (!window.gameState.profile.preferences) {
            window.gameState.profile.preferences = {
              volume: 0.5,
              isMuted: false,
              isBetaMode: false, // Garante que a flag exista ao carregar
            };
          } else if (window.gameState.profile.preferences.isBetaMode === undefined) {
            // Caso tenha preferências mas falte a nova flag
            window.gameState.profile.preferences.isBetaMode = false;
          }

          // Garante que a localização exista com defaults se ausente
          if (!window.gameState.profile.lastLocation) {
            window.gameState.profile.lastLocation = {
              lat: -25.5317,
              lng: -49.2707,
              timestamp: Date.now(),
            };
          }

          // Garante que o estado do clima exista com defaults
          if (!window.gameState.currentWeather) {
            window.gameState.currentWeather = {
              isDay: true,
              temperature: null,
              condition: "Céu Limpo",
              icon: "fa-sun",
              rawCode: 0,
              lastFetch: 0,
            };
          }


          // Garante que os itens carregados tenham a spriteUrl.
          window.gameState.profile.items = window.gameState.profile.items.map(
            (savedItem) => {
              const configItem = GameConfig.SHOP_ITEMS.find(
                (c) => c.name === savedItem.name
              );
              return {
                ...savedItem,
                spriteUrl: configItem?.spriteUrl || "",
                ppRestore: configItem?.ppRestore || savedItem.ppRestore,
                healAmount:
                  savedItem.healAmount ?? configItem?.healAmount ?? 0,
              };
            }
          );

          GameConfig.SHOP_ITEMS.forEach((shopItem) => {
            const exists = window.gameState.profile.items.some(
              (item) => item.name === shopItem.name
            );
            if (!exists) {
              window.gameState.profile.items.push({
                ...shopItem,
                quantity: 0,
              });
            }
          });

          window.gameState.profile.pokemon =
            (window.gameState.profile.pokemon || []).map((poke) => {
              const hasTracking =
                typeof poke?.specialMoveRemaining === "number" &&
                typeof poke?.normalMoveRemaining === "number";
              return Utils.applyMoveTemplate(poke, {
                forceResetUses: !hasTracking,
              });
            });

          if (savedExploreLog) {
            window.gameState.exploreLog = JSON.parse(savedExploreLog);
          }
          window.gameState.pendingSupportItem = null;
          console.log("Jogo Carregado com Sucesso!");
          return true;
        }
      } catch (error) {
        console.error("Erro ao carregar jogo:", error);
      }
      return false;
    },

    resetGameData: function () {
      try {
        localStorage.removeItem("pokemonGameProfile");
        localStorage.removeItem("pokemonGameExploreLog");
        localStorage.removeItem("pokemonGamePokedexCache");
        console.log("Dados do jogo resetados.");

        window.Utils.showModal(
          "infoModal",
          "Dados apagados com sucesso! Recarregando..."
        );
        setTimeout(() => window.location.reload(), 1500);
      } catch (e) {
        console.error("Erro ao resetar dados:", e);
        window.Utils.showModal("errorModal", "Falha ao resetar os dados.");
      }
    },

    registerPokemon: function (pokemonId) {
      if (!window.gameState || !window.gameState.profile) return;

      if (!(window.gameState.profile.pokedex instanceof Set)) {
        let iterablePokedex = [];

        if (Array.isArray(window.gameState.profile.pokedex)) {
          iterablePokedex = window.gameState.profile.pokedex;
        }

        window.gameState.profile.pokedex = new Set(
          iterablePokedex
        );
        console.warn("Pokedex re-inicializada como Set.");
      }

      const id = parseInt(pokemonId);
      if (!window.gameState.profile.pokedex.has(id)) {
        window.gameState.profile.pokedex.add(id);
        console.log(`Pokémon ID ${id} registrado na Pokédex.`);
        Utils.saveGame();
      }
    },

    applyVolume: function (volume, isMuted) {
      if (window.backgroundMusic) {
        window.backgroundMusic.volume = isMuted ? 0 : volume;
      }
    },

    updateVolume: function (newVolume) {
      window.gameState.profile.preferences.volume = parseFloat(newVolume);
      window.gameState.profile.preferences.isMuted = false;
      Utils.applyVolume(
        window.gameState.profile.preferences.volume,
        false
      );
      if (window.Renderer) {
        window.Renderer.renderPreferences(
          document.getElementById("app-container")
        );
      }
    },

    toggleMute: function () {
      const prefs = window.gameState.profile.preferences;
      prefs.isMuted = !prefs.isMuted;
      Utils.applyVolume(prefs.volume, prefs.isMuted);
      Utils.saveGame();
      if (window.Renderer) {
        window.Renderer.renderPreferences(
          document.getElementById("app-container")
        );
      }
    },

    getTypeSpecialMove: function (typesOrPrimary) {
      if (!typesOrPrimary) {
        return TYPE_SPECIAL_MOVES.normal;
      }
      let primaryType = Array.isArray(typesOrPrimary)
        ? typesOrPrimary[0]
        : typesOrPrimary;
      primaryType = String(primaryType || "normal").toLowerCase();
      return TYPE_SPECIAL_MOVES[primaryType] || TYPE_SPECIAL_MOVES.normal;
    },

    applyMoveTemplate: function (pokemon, options = {}) {
      if (!pokemon) return pokemon;
      const { forceResetUses = false } = options;
      const normalMove = GameConfig.DEFAULT_NORMAL_MOVE || DEFAULT_NORMAL_MOVE;
      const specialMove = Utils.getTypeSpecialMove(pokemon.types);

      pokemon.normalMove = normalMove;
      pokemon.specialMove = specialMove;

      const moves = [normalMove];
      if (specialMove && specialMove !== normalMove) {
        moves.push(specialMove);
      } else if (moves.length < 2) {
        moves.push("quick-attack");
      }
      pokemon.moves = moves;

      Utils.ensureMoveCounters(pokemon, { forceReset: forceResetUses });

      return pokemon;
    },

    ensureMoveCounters: function (pokemon, options = {}) {
      if (!pokemon) return;
      const { forceReset = false } = options;

      // NOVO: Sistema de PA individual por movimento
      // Inicializa moveUses se não existir
      if (!pokemon.moveUses || typeof pokemon.moveUses !== "object") {
        pokemon.moveUses = {};
      }

      // Define valores de PA máximo: 30 para normais, 15 para especiais
      const NORMAL_MOVE_PA = 30;
      const SPECIAL_MOVE_PA = 15;

      // Garante que cada movimento tenha seu PA individual
      if (pokemon.moves && Array.isArray(pokemon.moves)) {
        pokemon.moves.forEach((move) => {
          const moveName = typeof move === "string" ? move : move.name || move;
          const isSpecial = Utils.isSpecialMove(pokemon, moveName);
          const maxPA = isSpecial ? SPECIAL_MOVE_PA : NORMAL_MOVE_PA;

          if (!pokemon.moveUses[moveName] || forceReset) {
            pokemon.moveUses[moveName] = {
              remaining: maxPA,
              max: maxPA,
            };
          } else {
            // Garante que o PA não exceda o máximo
            pokemon.moveUses[moveName].max = maxPA;
            pokemon.moveUses[moveName].remaining = Math.max(
              0,
              Math.min(pokemon.moveUses[moveName].remaining, maxPA)
            );
          }
        });
      }

      // Mantém compatibilidade com o sistema antigo (para migração)
      const normalMax =
        pokemon.normalMoveMaxUses ||
        GameConfig.NORMAL_MOVE_MAX_USES ||
        DEFAULT_NORMAL_MOVE_MAX_USES;
      pokemon.normalMoveMaxUses = normalMax;
      if (forceReset || typeof pokemon.normalMoveRemaining !== "number") {
        pokemon.normalMoveRemaining = normalMax;
      } else {
        pokemon.normalMoveRemaining = Math.max(
          0,
          Math.min(pokemon.normalMoveRemaining, normalMax)
        );
      }

      const specialMax =
        pokemon.specialMoveMaxUses ||
        GameConfig.SPECIAL_MOVE_MAX_USES ||
        SPECIAL_MOVE_MAX_USES;
      pokemon.specialMoveMaxUses = specialMax;
      if (forceReset || typeof pokemon.specialMoveRemaining !== "number") {
        pokemon.specialMoveRemaining = specialMax;
      } else {
        pokemon.specialMoveRemaining = Math.max(
          0,
          Math.min(pokemon.specialMoveRemaining, specialMax)
        );
      }
    },

    // NOVO: Função para obter PA de um movimento específico
    getMovePA: function (pokemon, moveName) {
      if (!pokemon || !moveName) return { remaining: 0, max: 0 };
      if (pokemon.moveUses && pokemon.moveUses[moveName]) {
        return pokemon.moveUses[moveName];
      }
      // Fallback: se não tiver PA individual, usa o sistema antigo
      const isSpecial = Utils.isSpecialMove(pokemon, moveName);
      const max = isSpecial
        ? (pokemon.specialMoveMaxUses || SPECIAL_MOVE_MAX_USES)
        : (pokemon.normalMoveMaxUses || GameConfig.NORMAL_MOVE_MAX_USES || DEFAULT_NORMAL_MOVE_MAX_USES);
      const remaining = isSpecial
        ? (pokemon.specialMoveRemaining || max)
        : (pokemon.normalMoveRemaining || max);
      return { remaining, max };
    },

    // NOVO: Função para usar PA de um movimento
    useMovePA: function (pokemon, moveName) {
      if (!pokemon || !moveName) return false;
      Utils.ensureMoveCounters(pokemon);
      
      if (pokemon.moveUses && pokemon.moveUses[moveName]) {
        if (pokemon.moveUses[moveName].remaining > 0) {
          pokemon.moveUses[moveName].remaining--;
          return true;
        }
        return false;
      }
      // Fallback para sistema antigo
      const isSpecial = Utils.isSpecialMove(pokemon, moveName);
      if (isSpecial) {
        if (pokemon.specialMoveRemaining > 0) {
          pokemon.specialMoveRemaining--;
          return true;
        }
      } else {
        if (pokemon.normalMoveRemaining > 0) {
          pokemon.normalMoveRemaining--;
          return true;
        }
      }
      return false;
    },

    restoreMoveCharges: function (pokemon, scope = "all") {
      if (!pokemon) return;
      const applyNormal = scope === "all" || scope === "normal";
      const applySpecial = scope === "all" || scope === "special";

      // NOVO: Restaura PA individual por movimento
      if (pokemon.moveUses && pokemon.moves) {
        const NORMAL_MOVE_PA = 30;
        const SPECIAL_MOVE_PA = 15;
        
        pokemon.moves.forEach((move) => {
          const moveName = typeof move === "string" ? move : move.name || move;
          const isSpecial = Utils.isSpecialMove(pokemon, moveName);
          
          if ((isSpecial && applySpecial) || (!isSpecial && applyNormal)) {
            const maxPA = isSpecial ? SPECIAL_MOVE_PA : NORMAL_MOVE_PA;
            if (!pokemon.moveUses[moveName]) {
              pokemon.moveUses[moveName] = { remaining: maxPA, max: maxPA };
            } else {
              pokemon.moveUses[moveName].remaining = maxPA;
              pokemon.moveUses[moveName].max = maxPA;
            }
          }
        });
      }

      // Mantém compatibilidade com sistema antigo
      if (applyNormal) {
        const normalMax =
          pokemon.normalMoveMaxUses ||
          GameConfig.NORMAL_MOVE_MAX_USES ||
          DEFAULT_NORMAL_MOVE_MAX_USES;
        pokemon.normalMoveMaxUses = normalMax;
        pokemon.normalMoveRemaining = normalMax;
      }

      if (applySpecial) {
        const specialMax =
          pokemon.specialMoveMaxUses ||
          GameConfig.SPECIAL_MOVE_MAX_USES ||
          SPECIAL_MOVE_MAX_USES;
        pokemon.specialMoveMaxUses = specialMax;
        pokemon.specialMoveRemaining = specialMax;
      }
    },

    isSpecialMove: function (pokemon, moveName) {
      if (!pokemon || !moveName) return false;
      return pokemon.specialMove === moveName;
    },

    // NOVO: Função para alternar o modo Beta
    toggleBetaMode: function () {
      const prefs = window.gameState.profile.preferences;
      prefs.isBetaMode = !prefs.isBetaMode;
      Utils.saveGame();

      // Redireciona para o menu principal para aplicar a nova navegação
      if (window.Renderer) {
        window.Utils.showModal("infoModal", `Modo BETA ${prefs.isBetaMode ? 'ATIVADO' : 'DESATIVADO'}.`);
        window.Renderer.showScreen('mainMenu');
      }
    },

    showModal: function (id, message = "") {
      const modal = document.getElementById(id);
      if (!modal) return;
      const messageElement = modal.querySelector(".modal-message");
      if (messageElement) {
        messageElement.innerHTML = message; // Usando innerHTML para suportar HTML no modal
      }
      modal.classList.remove("hidden");
    },

    hideModal: function (id) {
      document.getElementById(id).classList.add("hidden");
    },

    formatName: function (name) {
      return name
        .replace(/-/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    },

    getActivePokemon: function () {
      // CORREÇÃO: Pega o Pokémon baseado no índice armazenado na batalha,
      // sem pressupor que ele está na posição 0 do array.
      const index = window.gameState.battle?.playerPokemonIndex || 0;
      return window.gameState.profile.pokemon[index];
    },

    calculateMaxHp: function (baseHp, level) {
      const { HP_BASE_MULTIPLIER, HP_LEVEL_MULTIPLIER } = GameConfig;

      let finalMaxHp = Math.floor(
        baseHp * HP_BASE_MULTIPLIER + level * HP_LEVEL_MULTIPLIER + 10
      );

      finalMaxHp = Math.max(10, finalMaxHp);

      return finalMaxHp;
    },

    calculateExpToNextLevel: function (level) {
      const { EXP_BASE, EXP_GROWTH_RATE } = GameConfig;
      return Math.floor(EXP_BASE * Math.pow(level + 1, EXP_GROWTH_RATE));
    },
  };

  // 4. Definição do registerExistingPokemonOnLoad
  function registerExistingPokemonOnLoad() {
    if (
      window.gameState &&
      window.gameState.profile &&
      window.gameState.profile.pokemon
    ) {
      window.gameState.profile.pokemon.forEach((p) => {
        if (p.id) {
          Utils.registerPokemon(p.id);
        }
        const hasTracking =
          typeof p?.specialMoveRemaining === "number" &&
          typeof p?.normalMoveRemaining === "number";
        Utils.applyMoveTemplate(p, { forceResetUses: !hasTracking });
      });
    }
  }

  // Helpers locais
  function idToNameLocal(id) {
    return POKE_DATA[String(id)]?.name || String(id);
  }

  function flattenBranches(branches) {
    const seen = new Set();
    const flat = [];
    for (const path of branches || []) {
      for (const node of path) {
        if (!seen.has(node.id)) {
          seen.add(node.id);
          flat.push({ id: node.id, name: node.name });
        }
      }
    }
    return flat;
  }

  function findPathToTarget(branches, targetId) {
    for (const path of branches || []) {
      const idx = path.findIndex(n => n.id === targetId);
      if (idx !== -1) {
        return path.slice(0, idx + 1).map(n => ({ id: n.id, name: n.name }));
      }
    }
    return null;
  }

  function locateChainContainingId(evoChainsObj, id) {
    // Procura a cadeia (array) que contém o id em qualquer posição
    for (const key of Object.keys(evoChainsObj)) {
      const arr = evoChainsObj[key];
      if (!Array.isArray(arr) || !arr.length) continue;
      const head = arr[0];
      // Verifica branches no head (caso base ramificado tipo Eevee, Tyrogue)
      if (head && Array.isArray(head.branches) && head.branches.length) {
        if (head.id === id) {
          return { baseKey: key, chainArr: arr, head, branchesSource: head };
        }
      }
      // Agora verifica branches em cada elemento (caso intermediário ramificado tipo Gloom, Poliwhirl, Kirlia)
      for (let i = 0; i < arr.length; i++) {
        const curr = arr[i];
        if (curr && Array.isArray(curr.branches) && curr.branches.length) {
          if (curr.id === id) {
            return { baseKey: key, chainArr: arr, head, branchesSource: curr };
          }
        }
        // Também registra se o elemento procurado existe no array (mesmo sem branches)
        if (curr && curr.id === id) {
          // Não retorna aqui, pois queremos o elemento com branches se houver, senão só identifica que existe
          // O retorno para casos lineares é tratado depois na lógica principal
        }
      }
      // Checa também se o id está no conjunto geral de ids desse array para fallback linear
      const idSet = new Set(arr.map(e => e.id));
      if (idSet.has(id)) {
        return { baseKey: key, chainArr: arr, head, branchesSource: null };
      }
    }
    return null;
  }

  // 5. Definição do PokeAPI (agora com dados locais)
  const PokeAPI = {
    /**
     * Obtém os dados de Pokémon de POKE_DATA (local).
     * @param {number|string} idOrName - ID ou nome do Pokémon (localizado em POKE_DATA).
     * @param {boolean} isPokedexView - Se é para visualização na Pokédex (usa stats base).
     * @returns {object|null} Dados formatados do Pokémon.
     */

    REVERSE_BRANCHED_EVOS: REVERSE_BRANCHED_EVOS,
    BRANCHED_EVOS: BRANCHED_EVOS,



    async fetchPokemonData(idOrName, isPokedexView = false) {
      let pokemonId = String(idOrName).toLowerCase();

      if (isNaN(parseInt(pokemonId))) {
        const foundEntry = Object.values(POKE_DATA).find(
          (p) => p.name.toLowerCase() === pokemonId
        );
        if (foundEntry) {
          pokemonId = String(foundEntry.id);
        } else {
          console.error(`Pokémon ${idOrName} não encontrado nos dados locais.`);
          return null;
        }
      } else {
        pokemonId = String(idOrName);
      }

      const data = POKE_DATA[pokemonId];

      if (!data) {
        console.error(`Dados para o ID ${pokemonId} não encontrados.`);
        return null;
      }

      const initialLevel = 5;
      const baseHp = data.stats.hp;
      const calculatedMaxHp = Utils.calculateMaxHp(baseHp, initialLevel);

      const result = {
        name: data.name,
        id: data.id,
        // Os sprites agora vêm do objeto de dados local
        sprite: data.front_sprite,
        backSprite: data.back_sprite,
        stats: data.stats,
        maxHp: isPokedexView ? baseHp : calculatedMaxHp,
        level: initialLevel,
        currentHp: isPokedexView ? baseHp : calculatedMaxHp,
        exp: 0,
        moves: data.moves.slice(0, 4),
        types: data.types,
      };

      if (!isPokedexView) {
        Utils.applyMoveTemplate(result, { forceResetUses: true });
      }

      if (window.gameState && window.gameState.pokedexCache) {
        if (result.id) {
          // Popula o cache para a Pokédex
          window.gameState.pokedexCache[result.id] = {
            name: result.name,
            types: result.types,
            spriteUrl: result.sprite
          };
        }

        if (!isPokedexView) {
          Utils.registerPokemon(result.id);
        }
      } else {
        console.warn("Aviso: window.gameState ou pokedexCache não totalmente inicializados ao buscar Pokémon selvagem.");
      }

      if (window.gameState.currentScreen === 'battle' && !isPokedexView) {
        result.sprite = data.front_sprite;
      }


      return result;
    },

    /**
     * Obtém a próxima evolução de um Pokémon.
     */
    fetchNextEvolution: async function (pokemonId) {
      const chains = Object.values(EVOLUTION_CHAINS);

      for (const chain of chains) {
        const currentIndex = chain.findIndex((p) => p.id === pokemonId);
        if (currentIndex !== -1) {
          const nextEvolution = chain[currentIndex + 1];
          if (nextEvolution) {
            return nextEvolution.name.toLowerCase();
          }
          return null;
        }
      }
      return null;
    },

    /**
     * Obtém dados de espécie do SPECIES_DATA local.
     */
    fetchSpeciesData: async function (pokemonId) {
      const data = SPECIES_DATA[String(pokemonId)];
      if (data) {
        return {
          description: data.description.replace(/\n/g, " "),
          height: data.height,
          weight: data.weight,
          isLegendary: data.isLegendary,
          isMythical: data.isMythical,
        };
      }
      return { description: "Descrição não encontrada.", height: 0, weight: 0 };
    },

    /**
     * Obtém a cadeia evolutiva de um Pokémon do EVOLUTION_CHAINS local.
     * MUDANÇA: Agora incorpora as regras de ramificação para Pokémons com múltiplas evoluções.
     * @param {number} pokemonId - ID do Pokémon para buscar a cadeia.
     * @returns {Array<object>} Lista de objetos de evolução.
     */
    fetchEvolutionChainData: async function (pokemonId) {
      const id = Number(pokemonId);

      // Encontre a cadeia e possíveis ramificações no head ou intermediário
      const located = locateChainContainingId(EVOLUTION_CHAINS, id);
      if (!located) {
        // fallback: retorna apenas o próprio se não achou cadeia
        const self = POKE_DATA[String(id)];
        return self ? [{ id: self.id, name: self.name }] : [];
      }

      // Caso branches no nó principal (head) OU no intermediário (branchesSource)
      if (located.branchesSource && Array.isArray(located.branchesSource.branches) && located.branchesSource.branches.length) {
        // retorna nó + todos UNIQUE das branches desse nó
        return [
          { id: located.branchesSource.id, name: located.branchesSource.name },
          ...flattenBranches(located.branchesSource.branches)
        ];
      }

      // Caso forma evoluída ramificada (usando o mapa reverso)
      const revOrigin = REVERSE_BRANCHED_EVOS[String(id)];
      if (revOrigin) {
        console.log("revOrigin");
        console.log(revOrigin);
        // Encontra a cadeia do origin
        const originLocated = locateChainContainingId(EVOLUTION_CHAINS, revOrigin);
        if (originLocated && originLocated.branchesSource && originLocated.branchesSource.branches) {
          // Caminho da branch do origin até o id atual
          const path = findPathToTarget(originLocated.branchesSource.branches, id);
          if (path && path.length) {
            // Se o próprio revOrigin (Eevee) não está incluído, adicione
            if (path[0].id !== Number(revOrigin)) {
              return [
                { id: Number(revOrigin), name: idToNameLocal(revOrigin) },
                ...path
              ];
            }
            return path;
          }
        }
        // Fallback: [origin, target]
        return [
          { id: Number(revOrigin), name: idToNameLocal(revOrigin) },
          { id, name: idToNameLocal(id) }
        ];
      }

      // Cadeia linear: retorna tudo do array na ordem
      const { chainArr } = located;
      return chainArr.map(p => ({ id: p.id, name: p.name }));
    },

    idToName: function (id) {
      return POKE_DATA[String(id)]?.name || null;
    }
  };

  return {
    GameConfig,
    initializeGameState,
    Utils,
    PokeAPI,
    registerExistingPokemonOnLoad
  };
}
